import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { Command } from '..';
import { EventData } from '../../models';
import { Lang } from '../../services';
import { TrustedRoleRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';
import { CollectorUtils } from '../../utils/collector-utils';

export class TrustedRoleClearSubCommand implements Command {
    constructor(public trustedRoleRepo: TrustedRoleRepo) {}
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
        let trustedRoleData = await this.trustedRoleRepo.getTrustedRoles(intr.guild.id);

        if (!trustedRoleData || trustedRoleData.trustedRoles.length === 0) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.emptyTrustedRole', data.lang())
            );
            return;
        }

        // Confirm
        let confirmation = await CollectorUtils.getBooleanFromReact(
            intr,
            data,
            Lang.getEmbed('prompts', 'clear.trustedRole', data.lang(), {
                TOTAL: trustedRoleData.trustedRoles.length.toString(),
                ICON: intr.client.user.displayAvatarURL(),
            })
        );

        if (confirmation === undefined) return;

        if (!confirmation) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results', 'fail.actionCanceled', data.lang())
            );
            return;
        }

        await this.trustedRoleRepo.clearTrustedRoles(intr.guild.id);

        await MessageUtils.sendIntr(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.trustedRoleClear', data.lang())
        );
    }
}
