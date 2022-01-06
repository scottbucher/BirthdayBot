import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';
import { Lang, Logger, SubscriptionService } from '../services';

import { Command } from './command';
import { EventData } from '../models/internal-models';
import { LangCode } from '../models/enums';
import { MessageUtils } from '../utils';
import { PlanName } from '../models';
import { channel } from 'diagnostics_channel';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');
export class SubscribeCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.subscribe'),
        description: 'Subscribe to Birthday Bot Premium.',
    };
    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    constructor(private subscriptionService: SubscriptionService) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        // These are currently under info, maybe they should be moved to validation?
        if (!Config.payments.enabled) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('info', 'premium.premiumDisabled', LangCode.EN_US)
            );
            return;
        }

        if (!Config.payments.allowNewTransactions) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('info', 'premium.refuseNewTransactions', LangCode.EN_US)
            );
            return;
        }

        let subLink = await this.subscriptionService.createSubscription(
            PlanName.premium1,
            intr.guild.id
        );
        if (!subLink) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('info', 'premium.premiumAlreadyActive', LangCode.EN_US)
            );
            return;
        }

        await MessageUtils.send(
            intr.user,
            Lang.getEmbed('info', 'premium.subscriptionPM', LangCode.EN_US, {
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

        await MessageUtils.sendIntr(
            intr,
            Lang.getEmbed('info', 'premium.subscriptionDMPrompt', LangCode.EN_US)
        );

        Logger.info(
            Logs.info.unsubRanSubCmd
                .replace('{SENDER_TAG}', intr.user.tag)
                .replace('{SENDER_ID}', intr.user.id)
                .replace('{GUILD_NAME}', intr.guild.name)
                .replace('{GUILD_ID}', intr.guild.id)
        );
        return;
    }
}
