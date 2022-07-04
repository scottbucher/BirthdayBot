import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, PermissionString } from 'discord.js';

import { CustomMessage, CustomMessages } from '../../models/database/custom-messages-models.js';
import { EventData } from '../../models/index.js';
import { CustomMessageRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class MessageEditEmbedSubCommand implements Command {
    constructor(public customMessageRepo: CustomMessageRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('subCommands.embed'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        // gets the type which is either BIRTHDAY, MEMBER_ANNIVERSARY, SERVER_ANNIVERSARY, USER_SPECIFIC_BIRTHDAY, or USER_SPECIFIC_MEMBER_ANNIVERSARY
        let type = intr.options.getString(Lang.getCom('arguments.type'))?.toLowerCase();

        let position = intr.options.getInteger(Lang.getCom('arguments.position'));

        let embed = intr.options.getBoolean(Lang.getCom('arguments.embed'));

        let databaseType = type.replaceAll('_', ''); // How we store the type in the database, for instance, memberanniversary
        if (databaseType.includes('specific'))
            databaseType = databaseType.includes('birthday') ? 'birthday' : 'memberanniversary';

        let isUserSpecific = type.includes('specific');

        // Retrieve message to remove
        let customMessages = await this.customMessageRepo.getCustomMessages(
            intr.guild.id,
            databaseType
        );
        let userMessages: CustomMessages;

        if (type === 'user_specific_birthday' || type === 'user_specific_member_anniversary') {
            userMessages = await this.customMessageRepo.getCustomUserMessages(
                intr.guild.id,
                databaseType
            );

            if (!userMessages) {
                await InteractionUtils.send(
                    intr,
                    Lang.getErrorEmbed(
                        'validation',
                        'errorEmbeds.' + databaseType === 'birthday'
                            ? 'noUserSpecificBirthdayMessages'
                            : 'noUserSpecificMemberAnniversaryMessages',
                        data.lang()
                    )
                );
                return;
            }

            let userMessage = userMessages.customMessages.filter(
                message => message.Position === position
            );

            if (userMessage.length > 0) position = userMessage[0].Position;
        }

        let message: CustomMessage;

        // find the position based on if it is a user or global message
        isUserSpecific
            ? (message = userMessages.customMessages.find(
                  question => question.Position === position
              ))
            : (message = customMessages.customMessages.find(
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

        // Update the question base on if it is a user or global message
        isUserSpecific
            ? await this.customMessageRepo.updateMessageEmbedUser(
                  intr.guild.id,
                  position,
                  databaseType,
                  embed ? 1 : 0
              )
            : await this.customMessageRepo.updateMessageEmbed(
                  intr.guild.id,
                  position,
                  databaseType,
                  embed
              );

        await InteractionUtils.send(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.updateMessageEmbed', data.lang(), {
                EMBED: Lang.getRef('info', 'boolean.' + (embed ? 'true' : 'false'), data.lang()),
                ICON: intr.client.user.displayAvatarURL(),
            })
        );
    }
}
