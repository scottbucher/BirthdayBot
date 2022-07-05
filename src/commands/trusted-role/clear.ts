import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../../models/index.js';
import { TrustedRoleRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { CollectorUtils, InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class TrustedRoleClearSubCommand implements Command {
    constructor(public trustedRoleRepo: TrustedRoleRepo) {}
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
        let trustedRoleData = await this.trustedRoleRepo.getTrustedRoles(intr.guild.id);

        if (!trustedRoleData || trustedRoleData.trustedRoles.length === 0) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.emptyTrustedRole', data.lang())
            );
            return;
        }

        // Confirm
        let result = await CollectorUtils.getBooleanFromButton(
            intr,
            data,
            Lang.getEmbed('prompts', 'clear.trustedRole', data.lang(), {
                TOTAL: trustedRoleData.trustedRoles.length.toString(),
                ICON: intr.client.user.displayAvatarURL(),
            })
        );

        if (result === undefined) return;

        if (!result.value) {
            await InteractionUtils.send(
                result.intr,
                Lang.getEmbed('results', 'fail.actionCanceled', data.lang())
            );
            return;
        }

        await this.trustedRoleRepo.clearTrustedRoles(intr.guild.id);

        await InteractionUtils.send(
            result.intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.trustedRoleClear', data.lang())
        );
    }
}
