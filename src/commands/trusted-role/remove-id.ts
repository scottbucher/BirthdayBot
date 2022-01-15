import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { Command } from '..';
import { EventData } from '../../models';
import { Lang } from '../../services';
import { TrustedRoleRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';

export class TrustedRoleRemoveIdSubCommand implements Command {
    constructor(public trustedRoleRepo: TrustedRoleRepo) {}
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

        let trustedRoleData = await this.trustedRoleRepo.getTrustedRoles(intr.guild.id);

        if (trustedRoleData.trustedRoles.map(b => b.TrustedRoleDiscordId).includes(id)) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.notInTrustedRole', data.lang(), {
                    ROLE: Lang.getRef('info', 'types.id', data.lang()),
                })
            );
            return;
        }

        //TODO: update trusted role remove procedure to remove based on id and not position
        // await this.trustedRoleRepo.removeTrustedRole(intr.guild.id, id);

        await MessageUtils.sendIntr(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.trustedRoleRemove', data.lang(), {
                TARGET: id,
            })
        );
    }
}
