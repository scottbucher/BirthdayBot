import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { ColorUtils, FormatUtils, MessageUtils, ParseUtils } from '../../utils';
import { Message, MessageReaction, TextChannel, User } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { CustomMessage, CustomMessages } from '../../models/database';

let Config = require('../../../config/config.json');

export class MessageEmbedSubCommand {
    // bday message embed type # T/F
    // 0    1       2     3    4 5

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
                Lang.getEmbed('validation.updateMessageInvalidType', LangCode.EN_US, {
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
                Lang.getEmbed('validation.customMessageInvalidMessageNumber', LangCode.EN_US, {
                    ICON: msg.client.user.displayAvatarURL(),
                })
            );
            return;
        }

        if (args.length < 6) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.updateMessageNoEmbed', LangCode.EN_US)
            );
            return;
        }

        let embed = FormatUtils.findBoolean(args[5]);

        if (!embed) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.updateMessageNoEmbed', LangCode.EN_US)
            );
            return;
        }

        // Update the question base on if it is a user or global message
        target
            ? await this.customMessageRepo.updateMessageEmbedUser(
                  msg.guild.id,
                  position,
                  type,
                  embed
              )
            : await this.customMessageRepo.updateMessageEmbed(msg.guild.id, position, type, embed);
    }
}
