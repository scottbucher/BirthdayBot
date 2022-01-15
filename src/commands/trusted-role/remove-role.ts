import { ApplicationCommandData, CommandInteraction, PermissionString, Role } from 'discord.js';

import { Command } from '..';
import { EventData } from '../../models';
import { Lang } from '../../services';
import { TrustedRoleRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';

export class TrustedRoleRemoveRoleSubCommand implements Command {
    constructor(public trustedRoleRepo: TrustedRoleRepo) {}
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('subCommands.add'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let role = intr.options.getRole(Lang.getCom('arguments.role'));

        if (!(role instanceof Role)) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed(
                    'validation',
                    'errorEmbeds.rawAPIInteractionDataReceived',
                    data.lang()
                )
            );
            return;
        }

        let trustedRoleData = await this.trustedRoleRepo.getTrustedRoles(intr.guild.id);

        if (trustedRoleData.trustedRoles.map(b => b.TrustedRoleDiscordId).includes(role.id)) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.notInTrustedRole', data.lang(), {
                    TYPE: Lang.getRef('info', 'types.role', data.lang()),
                })
            );
            return;
        }

        await this.trustedRoleRepo.addTrustedRole(intr.guild.id, role.id);

        await MessageUtils.sendIntr(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.trustedRoleRemove', data.lang(), {
                TARGET: role.toString(),
            })
        );
    }
}
