import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, PermissionString } from 'discord.js';

import { CustomMessage } from '../../models/database/index.js';
import { EventData } from '../../models/index.js';
import { CustomMessageRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { CelebrationUtils, FormatUtils, InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class MessageRemoveSubCommand implements Command {
    constructor(public customMessageRepo: CustomMessageRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('subCommands.remove'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let type = intr.options.getString(Lang.getCom('arguments.type')).toLowerCase();
        let position = intr.options.getInteger(Lang.getCom('arguments.position'));
        let isUserSpecific = type.includes('user');

        // TODO: change database types to use underscores as the commands do
        let databaseType = type.replaceAll('_', '');
        /**
         * In the database there are only three types, birthday, member anniversary, and server anniversary.
         * We determine if they are user specific by the UserDiscordId field in the message table
         */
        if (databaseType.includes('specific'))
            databaseType = databaseType.includes('birthday') ? 'birthday' : 'memberanniversary';

        let messageData = type.includes('specific')
            ? await this.customMessageRepo.getCustomUserMessages(intr.guild.id, databaseType)
            : await this.customMessageRepo.getCustomMessages(intr.guild.id, databaseType);

        let totalMessages = messageData.customMessages.length;
        // If it is a 0 the custom message technically needs a plural
        let displayType: string = FormatUtils.getCelebrationDisplayType(
            type.replaceAll('_', ''),
            totalMessages !== 1
        ).toLowerCase();

        if (totalMessages === 0) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed(
                    'validation',
                    'errorEmbeds.noCustomMessagesGeneric',
                    data.lang(),
                    {
                        DISPLAY_TYPE: displayType,
                    }
                )
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
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed(
                    'validation',
                    'errorEmbeds.customMessageInvalidPosition',
                    data.lang(),
                    {
                        ICON: intr.client.user.displayAvatarURL(),
                    }
                )
            );
            return;
        }

        // Remove the question base on if it is a user or global message
        isUserSpecific
            ? await this.customMessageRepo.removeCustomMessageUser(
                  intr.guild.id,
                  position,
                  databaseType
              )
            : await this.customMessageRepo.removeCustomMessage(
                  intr.guild.id,
                  position,
                  databaseType
              );

        await InteractionUtils.send(
            intr,
            Lang.getEmbed('results', 'customMessage.remove', data.lang(), {
                MESSAGE: CelebrationUtils.replaceLangPlaceHolders(
                    message.Message,
                    intr.guild,
                    databaseType,
                    message.UserDiscordId ? `<@${message.UserDiscordId}>` : null
                ),
                ICON: intr.client.user.displayAvatarURL(),
            })
        );
    }
}
