import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, PermissionString, Role } from 'discord.js';
import { createRequire } from 'node:module';

import { EventData } from '../../models/index.js';
import { TrustedRoleRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');
export class TrustedRoleAddSubCommand implements Command {
    constructor(public trustedRoleRepo: TrustedRoleRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('subCommands.add'),
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

        if (role.id === intr.guild.id) {
            // can't blacklist everyone
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed(
                    'validation',
                    'errorEmbeds.everyoneIsNotAValidRole',
                    data.lang(),
                    {
                        EVERYONE: role.toString(),
                    }
                )
            );
            return;
        }

        let trustedRoleData = await this.trustedRoleRepo.getTrustedRoles(intr.guild.id);

        if (trustedRoleData.trustedRoles.map(b => b.TrustedRoleDiscordId).includes(role.id)) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.alreadyInTrustedRole', data.lang(), {
                    ROLE: role.toString(),
                })
            );
            return;
        }

        if (
            trustedRoleData &&
            trustedRoleData.trustedRoles.length >= Config.validation.trustedRoles.maxCount.free &&
            !data.hasPremium
        ) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.trustedRoleMaxFree', data.lang(), {
                    FREE_MAX: Config.validation.trustedRoles.maxCount.free.toString(),
                    PAID_MAX: Config.validation.trustedRoles.maxCount.paid.toString(),
                })
            );
            return;
        } else if (
            trustedRoleData &&
            trustedRoleData.trustedRoles.length >= Config.validation.trustedRoles.maxCount.paid
        ) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.trustedRoleMaxPaid', data.lang(), {
                    PAID_MAX: Config.validation.trustedRoles.maxCount.paid.toString(),
                })
            );
            return;
        }

        await this.trustedRoleRepo.addTrustedRole(intr.guild.id, role.id);

        await InteractionUtils.send(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.trustedRoleAdd', data.lang(), {
                TARGET: role.toString(),
            })
        );
    }
}
