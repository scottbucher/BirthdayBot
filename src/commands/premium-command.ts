import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';
import { Logger, SubscriptionService, Lang } from '../services';
import { MessageUtils, TimeUtils } from '../utils';

import { Command } from './command';
import { PlanName } from '../models/subscription-models';
import { LangCode } from '../models/enums';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class PremiumCommand implements Command {
    public name: string = 'premium';
    public aliases = ['inv'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    constructor(private subscriptionService: SubscriptionService) { }

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {
        if (!Config.payments.enabled) {
            await MessageUtils.send(channel, Lang.getEmbed('results.premiumDisabled', LangCode.EN_US));
            return;
        }

        let subStatus = await this.subscriptionService.getSubscription(
            PlanName.premium1,
            msg.guild.id
        );

        if (!subStatus || !subStatus.service) {
            await MessageUtils.send(channel, Lang.getEmbed('premiumPrompts.noSubscription', LangCode.EN_US,
                {
                    BIRTHDAY_MESSAGE_MAX_FREE: Config.validation.message.maxCount.birthday.free.toLocaleString(),
                    BIRTHDAY_MESSAGE_MAX_PAID: Config.validation.message.maxCount.birthday.paid.free.toLocaleString(),
                    MEMBER_ANNIVERSARY_MESSAGE_MAX_FREE: Config.validation.message.maxCount.memberAnniversary.paid.free.toLocaleString(),
                    MEMBER_ANNIVERSARY_MESSAGE_MAX_PAID: Config.validation.message.maxCount.memberAnniversary.paid.free.toLocaleString(),
                    SERVER_ANNIVERSARY_MESSAGE_MAX_FREE: Config.validation.message.maxCount.serverAnniversary.paid.free.toLocaleString(),
                    SERVER_ANNIVERSARY_MESSAGE_MAX_PAID: Config.validation.message.maxCount.serverAnniversary.paid.free.toLocaleString(),
                    MAX_ANNIVERSARY_ROLES: Config.validation.trustedRoles.maxCount.paid.free.toLocaleString(),
                    MAX_TRUSTED_ROLES: Config.validation.maxCount.paid.free.toLocaleString()

                }));

            Logger.info(
                Logs.info.unsubRanPremiumCmd
                    .replace('{SENDER_TAG}', msg.author.tag)
                    .replace('{SENDER_ID}', msg.author.id)
                    .replace('{GUILD_NAME}', msg.guild.name)
                    .replace('{GUILD_ID}', msg.guild.id)
            );
            return;
        }

        let lastPayment = TimeUtils.getMoment(subStatus.subscription.times.lastPayment);
        let paidUntil = TimeUtils.getMoment(subStatus.subscription.times.paidUntil);

        let na = Lang.getRef('terms.na', LangCode.EN_US);
        await MessageUtils.send(channel, Lang.getEmbed('premiumPrompts.subscription', LangCode.EN_US,
            {
                IS_ACTIVE: Lang.getRef('boolean.' + subStatus.service ? 'yes' : 'no', LangCode.EN_US),
                SUBSCRIPTION_ID: subStatus.subscription.id
                    ? `[${subStatus.subscription.id}](${Lang.getRef('links.autopay', LangCode.EN_US)}/connect/${subStatus.subscription.id})`
                    : na,
                STATUS: subStatus.subscription.status ?? na,
                LAST_PAYMENT: lastPayment?.format('MMMM DD, YYYY, HH:mm UTC') ?? na,
                PAID_UNTIL: paidUntil?.format('MMMM DD, YYYY, HH:mm UTC') ?? na

            }));
        return;
    }
}
