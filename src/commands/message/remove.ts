import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { Command } from '..';
import { EventData } from '../../models';
import { CustomMessage } from '../../models/database';
import { LangCode } from '../../models/enums';
import { Lang } from '../../services';
import { CustomMessageRepo } from '../../services/database/repos';
import { CelebrationUtils, FormatUtils, MessageUtils } from '../../utils';

export class MessageRemoveSubCommand implements Command {
    constructor(public customMessageRepo: CustomMessageRepo) {}
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('subCommands.clear'),
        description: undefined,
    };

    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let type = intr.options.getString(Lang.getCom('arguments.type')).toLowerCase();
        let position = intr.options.getInteger(Lang.getCom('arguments.position'));
        let isUserSpecific = type.includes('user');

        let messageData = type.includes('user')
            ? await this.customMessageRepo.getCustomUserMessages(
                  intr.guild.id,
                  type.includes('birthday') ? 'birthday' : 'memberanniversary'
              )
            : await this.customMessageRepo.getCustomMessages(intr.guild.id, type);

        let totalMessages = messageData.customMessages.length;
        // If it is a 0 the custom message technically needs a plural
        let displayType: string = FormatUtils.getCelebrationDisplayType(
            type,
            totalMessages !== 1
        ).toLowerCase();

        if (totalMessages === 0) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('validation', 'errorEmbeds.noCustomMessagesGeneric', data.lang(), {
                    DISPLAY_TYPE: displayType,
                })
            );
            return;
        }

        let message: CustomMessage;

        // find the position based on if it is a user or global message
        isUserSpecific
            ? (message = messageData.customMessages.find(
                  question => question.Position === position
              ))
            : (message = messageData.customMessages.find(
                  question => question.Position === position
              ));

        if (!message) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed(
                    'validation',
                    'embeds.customMessageInvalidMessageNumber',
                    LangCode.EN_US,
                    {
                        ICON: intr.client.user.displayAvatarURL(),
                    }
                )
            );
            return;
        }

        // Remove the question base on if it is a user or global message
        isUserSpecific
            ? await this.customMessageRepo.removeCustomMessageUser(intr.guild.id, position, type)
            : await this.customMessageRepo.removeCustomMessage(intr.guild.id, position, type);

        await MessageUtils.sendIntr(
            intr,
            Lang.getEmbed('results', 'customMessage.remove', LangCode.EN_US, {
                MESSAGE: CelebrationUtils.replaceLangPlaceHolders(
                    message.Message,
                    intr.guild,
                    type,
                    message.UserDiscordId ?? null
                ),
                ICON: intr.client.user.displayAvatarURL(),
            })
        );
    }
}
