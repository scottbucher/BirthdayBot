import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../../models/index.js';
import { TrustedRoleRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class TrustedRoleRemoveIdSubCommand implements Command {
    constructor(public trustedRoleRepo: TrustedRoleRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('subCommands.id'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let id = intr.options.getString(Lang.getCom('arguments.id'));

        let trustedRoleData = await this.trustedRoleRepo.getTrustedRoles(intr.guild.id);

        if (!trustedRoleData.trustedRoles.map(b => b.TrustedRoleDiscordId).includes(id)) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.notInTrustedRole', data.lang(), {
                    TYPE: Lang.getRef('info', 'types.id', data.lang()),
                })
            );
            return;
        }

        await this.trustedRoleRepo.removeTrustedRole(intr.guild.id, id);

        await InteractionUtils.send(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.trustedRoleRemove', data.lang(), {
                TARGET: id,
            })
        );
    }
}
