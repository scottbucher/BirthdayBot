import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../../models/index.js';
import { CustomMessageRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { CollectorUtils } from '../../utils/collector-utils.js';
import { FormatUtils, InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class MessageClearSubCommand implements Command {
    constructor(public customMessageRepo: CustomMessageRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('subCommands.clear'),
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
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('validation', 'errorEmbeds.noCustomMessagesGeneric', data.lang(), {
                    DISPLAY_TYPE: displayType,
                })
            );
            return;
        }

        // Confirm
        let result = await CollectorUtils.getBooleanFromButton(
            intr,
            data,
            Lang.getEmbed('prompts', 'clear.customMessage', data.lang(), {
                MESSAGE_COUNT: totalMessages.toString(),
                DISPLAY_TYPE: displayType,
                ICON: intr.client.user.displayAvatarURL(),
            })
        );

        if (result === undefined) return;

        if (!result.value) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('results', 'fail.actionCanceled', data.lang())
            );
            return;
        }

        type.includes('user')
            ? await this.customMessageRepo.clearCustomUserMessages(
                  intr.guild.id,
                  type.includes('birthday') ? 'birthday' : 'memberanniversary'
              )
            : await this.customMessageRepo.clearCustomMessages(
                  intr.guild.id,
                  type.includes('member')
                      ? 'memberanniversary'
                      : type.includes('server')
                      ? 'serveranniversary'
                      : 'birthday'
              );

        await InteractionUtils.send(
            result.intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.customMessagesClear', data.lang(), {
                DISPLAY_TYPE: displayType,
            })
        );
    }
}
