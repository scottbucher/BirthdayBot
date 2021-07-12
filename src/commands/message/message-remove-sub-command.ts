import { CelebrationUtils, FormatUtils, MessageUtils, ParseUtils } from '../../utils';
import { CustomMessage, CustomMessages } from '../../models/database';
import { Message, TextChannel } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

export class MessageRemoveSubCommand {
    constructor(private customMessageRepo: CustomMessageRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let type = FormatUtils.extractCelebrationType(args[3]?.toLowerCase());

        if (
            type !== 'birthday' &&
            type !== 'memberanniversary' &&
            type !== 'serveranniversary' &&
            type !== 'userspecificbirthday' &&
            type !== 'userspecificmemberanniversary'
        ) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.removeMessageInvalidType', LangCode.EN_US, {
                    ICON: msg.client.user.displayAvatarURL(),
                })
            );
            return;
        }

        if (args.length < 5) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noMessageNumber', LangCode.EN_US)
            );
            return;
        }

        // Try and find someone they are mentioning
        let target = msg.mentions.members.first()?.user;

        // Try and get the position
        let position: number;

        // Retrieve message to remove
        let customMessages = await this.customMessageRepo.getCustomMessages(msg.guild.id, type);
        let userMessages: CustomMessages;

        if (type === 'userspecificbirthday' || type === 'userspecificmemberanniversary') {
            if (target) {
                type = type === 'userspecificbirthday' ? 'birthday' : 'memberanniversary';
                userMessages = await this.customMessageRepo.getCustomUserMessages(
                    msg.guild.id,
                    type
                );

                if (!userMessages) {
                    await MessageUtils.send(
                        channel,
                        Lang.getEmbed(
                            'validation.' + type === 'birthday'
                                ? 'noUserSpecificBirthdayMessages'
                                : 'noUserSpecificMemberAnniversaryMessages',
                            LangCode.EN_US
                        )
                    );
                    return;
                }

                let userMessage = userMessages.customMessages.filter(
                    message => message.UserDiscordId === target.id
                );

                if (userMessage.length > 0) position = userMessage[0].Position;
            }
        }

        if (!position) {
            position = ParseUtils.parseInt(args[4]);
        }

        if (!position) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.customMessageInvalidMessageNumber', LangCode.EN_US, {
                    ICON: msg.client.user.displayAvatarURL(),
                })
            );
            return;
        }

        let message: CustomMessage;

        // find the position based on if it is a user or global message
        target
            ? (message = userMessages.customMessages.find(
                  question => question.Position === position
              ))
            : (message = customMessages.customMessages.find(
                  question => question.Position === position
              ));

        if (!message) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validiation.customMessageInvalidMessageNumber', LangCode.EN_US, {
                    ICON: msg.client.user.displayAvatarURL(),
                })
            );
            return;
        }

        // Remove the question base on if it is a user or global message
        target
            ? await this.customMessageRepo.removeCustomMessageUser(msg.guild.id, position, type)
            : await this.customMessageRepo.removeCustomMessage(msg.guild.id, position, type);

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.removeMessage', LangCode.EN_US, {
                MESSAGE: target
                    ? CelebrationUtils.replaceLangPlaceHolders(
                          message.Message,
                          msg.guild,
                          type,
                          target.toString()
                      )
                    : CelebrationUtils.replaceLangPlaceHolders(
                          message.Message,
                          msg.guild,
                          type,
                          null
                      ),
                ICON: msg.client.user.displayAvatarURL(),
            })
        );
    }
}
