import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { Command } from '..';
import { EventData } from '../../models';
import { Lang } from '../../services';
import { MemberAnniversaryRoleRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';

export class MarRemoveIdSubCommand implements Command {
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
        let id = intr.options.getString(Lang.getCom('arguments.id'));

        let marData = await this.memberAnniversaryRoleRepo.getMemberAnniversaryRoles(intr.guild.id);

        if (
            marData.memberAnniversaryRoles.map(b => b.MemberAnniversaryRoleDiscordId).includes(id)
        ) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.notInMar', data.lang(), {
                    TYPE: Lang.getRef('info', 'types.id', data.lang()),
                })
            );
            return;
        }

        //TODO: Remove member anniversary roles based on id
        // await this.memberAnniversaryRoleRepo.removeMemberAnniversaryRole(intr.guild.id, role.id);

        await MessageUtils.sendIntr(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.marRemove', data.lang(), {
                TARGET: id,
            })
        );
    }
}
