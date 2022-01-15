import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { Command } from '..';
import { EventData } from '../../models';
import { Lang } from '../../services';
import { MemberAnniversaryRoleRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';

export class MarClearSubCommand implements Command {
    constructor(public memberAnniversaryRoleRepo: MemberAnniversaryRoleRepo) {}
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
        let marData = await this.memberAnniversaryRoleRepo.getMemberAnniversaryRoles(intr.guild.id);

        if (!marData || marData.memberAnniversaryRoles.length === 0) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.emptyMar', data.lang())
            );
            return;
        }

        await this.memberAnniversaryRoleRepo.clearMemberAnniversaryRoles(intr.guild.id);

        await MessageUtils.sendIntr(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.marClear', data.lang())
        );
    }
}
