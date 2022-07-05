import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, PermissionString } from 'discord.js';
import { createRequire } from 'node:module';

import { EventData } from '../models/index.js';
import { Lang, Logger } from '../services/index.js';
import { InteractionUtils, TimeUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');
export class PremiumCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.premium'),
        description: 'View information about premium, or about your current premium subscription.',
        dm_permission: true,
        default_member_permissions: undefined,
    };
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        if (!Config.payments.enabled) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('info', 'premium.premiumDisabled', data.lang())
            );
            return;
        }

        let subStatus = data.subscription;

        if (!subStatus || !subStatus.service) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('info', 'premium.noSubscription', data.lang(), {
                    BIRTHDAY_MESSAGE_MAX_FREE:
                        Config.validation.message.maxCount.birthday.free.toString(),
                    BIRTHDAY_MESSAGE_MAX_PAID:
                        Config.validation.message.maxCount.birthday.paid.toString(),
                    MEMBER_ANNIVERSARY_MESSAGE_MAX_FREE:
                        Config.validation.message.maxCount.memberAnniversary.free.toString(),
                    MEMBER_ANNIVERSARY_MESSAGE_MAX_PAID:
                        Config.validation.message.maxCount.memberAnniversary.paid.toString(),
                    SERVER_ANNIVERSARY_MESSAGE_MAX_FREE:
                        Config.validation.message.maxCount.serverAnniversary.free.toString(),
                    SERVER_ANNIVERSARY_MESSAGE_MAX_PAID:
                        Config.validation.message.maxCount.serverAnniversary.paid.toString(),
                    MAX_ANNIVERSARY_ROLES:
                        Config.validation.memberAnniversaryRoles.maxCount.paid.toString(),
                    MAX_TRUSTED_ROLES: Config.validation.trustedRoles.maxCount.paid.toString(),
                })
            );

            Logger.info(
                Logs.info.unsubRanPremiumCmd
                    .replaceAll('{SENDER_TAG}', intr.user.tag)
                    .replaceAll('{SENDER_ID}', intr.user.id)
                    .replaceAll('{GUILD_NAME}', intr.guild ? intr.guild.name : 'DM')
                    .replaceAll('{GUILD_ID}', intr.guild ? intr.guild.id : 'DM')
            );
            return;
        }

        let lastPayment = TimeUtils.getMoment(subStatus.subscription.times.lastPayment);
        let paidUntil = TimeUtils.getMoment(subStatus.subscription.times.paidUntil);

        let na = Lang.getRef('info', 'terms.na', data.lang());
        await InteractionUtils.send(
            intr,
            Lang.getEmbed('info', 'premium.subscription', data.lang(), {
                IS_ACTIVE: Lang.getRef(
                    'info',
                    'boolean.' + (subStatus.service ? 'yes' : 'no'),
                    data.lang()
                ),
                SUBSCRIPTION_ID: subStatus.subscription.id
                    ? `[${subStatus.subscription.id}](${Lang.getCom('links.autopay')}/connect/${
                          subStatus.subscription.id
                      })`
                    : na,
                STATUS: subStatus.subscription.status ?? na,
                LAST_PAYMENT: lastPayment?.format('MMMM DD, YYYY, HH:mm UTC') ?? na,
                PAID_UNTIL: paidUntil?.format('MMMM DD, YYYY, HH:mm UTC') ?? na,
            })
        );
        return;
    }
}
