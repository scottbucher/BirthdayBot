import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';
import { Lang, Logger } from '../services';
import { MessageUtils, TimeUtils } from '../utils';

import { EventData } from '../models/internal-models';
import { Command } from './command';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');
export class PremiumCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.premium'),
        description: 'View information about premium, or about your current premium subscription.',
    };
    public requireDev = false;
    public requireGuild = false;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        if (!Config.payments.enabled) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('info', 'premium.premiumDisabled', data.lang())
            );
            return;
        }

        let subStatus = data.subscription;

        if (!subStatus || !subStatus.service) {
            await MessageUtils.sendIntr(
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
                    .replace('{SENDER_TAG}', intr.user.tag)
                    .replace('{SENDER_ID}', intr.user.id)
                    .replace('{GUILD_NAME}', intr.guild.name)
                    .replace('{GUILD_ID}', intr.guild.id)
            );
            return;
        }

        let lastPayment = TimeUtils.getMoment(subStatus.subscription.times.lastPayment);
        let paidUntil = TimeUtils.getMoment(subStatus.subscription.times.paidUntil);

        let na = Lang.getRef('info', 'terms.na', data.lang());
        await MessageUtils.sendIntr(
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
