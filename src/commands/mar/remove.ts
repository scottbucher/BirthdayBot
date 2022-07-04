import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../../models/index.js';
import { MemberAnniversaryRoleRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class MarRemoveSubCommand implements Command {
    constructor(public memberAnniversaryRoleRepo: MemberAnniversaryRoleRepo) {}
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
        let year = intr.options.getInteger(Lang.getCom('arguments.year'));

        let marData = await this.memberAnniversaryRoleRepo.getMemberAnniversaryRoles(intr.guild.id);

        if (!marData.memberAnniversaryRoles.map(b => b.Year).includes(year)) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.notInMar', data.lang())
            );
            return;
        }

        await this.memberAnniversaryRoleRepo.removeMemberAnniversaryRole(intr.guild.id, year);

        await InteractionUtils.send(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.marRemove', data.lang(), {
                YEAR: year.toString(),
            })
        );
    }
}
