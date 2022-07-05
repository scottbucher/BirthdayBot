import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, PermissionString, Role } from 'discord.js';

import { EventData } from '../../models/index.js';
import { TrustedRoleRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class TrustedRoleRemoveRoleSubCommand implements Command {
    constructor(public trustedRoleRepo: TrustedRoleRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('subCommands.role'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let role = intr.options.getRole(Lang.getCom('arguments.role'));

        if (!(role instanceof Role)) {
            await InteractionUtils.send(
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

        if (!trustedRoleData.trustedRoles.map(b => b.TrustedRoleDiscordId).includes(role.id)) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.notInTrustedRole', data.lang(), {
                    TYPE: Lang.getRef('info', 'types.role', data.lang()),
                })
            );
            return;
        }

        await this.trustedRoleRepo.removeTrustedRole(intr.guild.id, role.id);

        await InteractionUtils.send(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.trustedRoleRemove', data.lang(), {
                TARGET: role.toString(),
            })
        );
    }
}
