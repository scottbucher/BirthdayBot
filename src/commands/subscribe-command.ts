import { DMChannel, Message, TextChannel } from 'discord.js';
import { Lang, Logger, SubscriptionService } from '../services';

import { Command } from './command';
import { LangCode } from '../models/enums';
import { MessageUtils } from '../utils';
import { PlanName } from '../models/subscription-models';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class SubscribeCommand implements Command {
    public name: string = 'subscribe';
    public aliases = ['buy', 'purchase', 'sub'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    constructor(private subscriptionService: SubscriptionService) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {
        if (!Config.payments.enabled) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('premiumPrompts.premiumDisabled', LangCode.EN_US)
            );
            return;
        }

        if (!Config.payments.allowNewTransactions) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('premiumPrompts.refuseNewTransactions', LangCode.EN_US)
            );
            return;
        }

        let subLink = await this.subscriptionService.createSubscription(
            PlanName.premium1,
            msg.guild.id
        );
        if (!subLink) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('premiumPrompts.premiumAlreadyActive', LangCode.EN_US)
            );
            return;
        }

        await MessageUtils.send(
            msg.author,
            Lang.getEmbed('premiumPrompts.subscriptionPM', LangCode.EN_US, {
                SUB_LINK: subLink.link,
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

        await MessageUtils.send(
            channel,
            Lang.getEmbed('premiumPrompts.subscriptionDMPrompt', LangCode.EN_US)
        );

        Logger.info(
            Logs.info.unsubRanSubCmd
                .replace('{SENDER_TAG}', msg.author.tag)
                .replace('{SENDER_ID}', msg.author.id)
                .replace('{GUILD_NAME}', msg.guild.name)
                .replace('{GUILD_ID}', msg.guild.id)
        );
        return;
    }
}
