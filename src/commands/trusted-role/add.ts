import { ApplicationCommandData, CommandInteraction, PermissionString, Role } from 'discord.js';
import { createRequire } from 'node:module';

import { LangCode } from '../../models/enums/language.js';
import { EventData } from '../../models/index.js';
import { TrustedRoleRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { MessageUtils } from '../../utils/index.js';
import { Command } from '../index.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');
export class TrustedRoleAddSubCommand implements Command {
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
        let hasPremium =
            !Config.payments.enabled || (data.subscription && data.subscription.service);

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
                Lang.getErrorEmbed('validation', 'errorEmbeds.alreadyInTrustedRole', data.lang(), {
                    ROLE: role.toString(),
                })
            );
            return;
        }

        if (
            trustedRoleData &&
            trustedRoleData.trustedRoles.length >= Config.validation.trustedRoles.maxCount.free &&
            !hasPremium
        ) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.trustedRoleMaxFree', LangCode.EN_US, {
                    FREE_MAX: Config.validation.trustedRoles.maxCount.free.toString(),
                    PAID_MAX: Config.validation.trustedRoles.maxCount.paid.toString(),
                })
            );
            return;
        } else if (
            trustedRoleData &&
            trustedRoleData.trustedRoles.length >= Config.validation.trustedRoles.maxCount.paid
        ) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('validation', 'errorEmbeds.trustedRoleMaxPaid', LangCode.EN_US, {
                    PAID_MAX: Config.validation.trustedRoles.maxCount.paid.toString(),
                })
            );
            return;
        }

        await this.trustedRoleRepo.addTrustedRole(intr.guild.id, role.id);

        await MessageUtils.sendIntr(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.trustedRoleAdd', data.lang(), {
                TARGET: role.toString(),
            })
        );
    }
}
