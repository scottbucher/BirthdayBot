import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { Command } from '..';
import { EventData } from '../../models';
import { Lang } from '../../services';
import { MemberAnniversaryRoleRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';

export class MarRemoveSubCommand implements Command {
    constructor(public memberAnniversaryRoleRepo: MemberAnniversaryRoleRepo) {}
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('subCommands.add'),
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
        let year = intr.options.getInteger(Lang.getCom('arguments.year'));

        let marData = await this.memberAnniversaryRoleRepo.getMemberAnniversaryRoles(intr.guild.id);

        if (marData.memberAnniversaryRoles.map(b => b.Year).includes(year)) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.notInMar', data.lang())
            );
            return;
        }

        await this.memberAnniversaryRoleRepo.removeMemberAnniversaryRole(intr.guild.id, year);

        await MessageUtils.sendIntr(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.marRemove', data.lang(), {
                YEAR: year.toString(),
            })
        );
    }
}
