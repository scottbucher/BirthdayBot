import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { PlanName } from '../models';
import { EventData } from '../models/internal-models';
import { Lang, Logger, SubscriptionService } from '../services';
import { MessageUtils } from '../utils';
import { Command, CommandDeferType } from './command';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');
export class SubscribeCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.subscribe'),
        description: 'Subscribe to Birthday Bot Premium.',
    };
    public deferType = CommandDeferType.PUBLIC;
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
                Lang.getEmbed('info', 'premium.premiumDisabled', data.lang())
            );
            return;
        }

        if (!Config.payments.allowNewTransactions) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('info', 'premium.refuseNewTransactions', data.lang())
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
                Lang.getEmbed('info', 'premium.premiumAlreadyActive', data.lang())
            );
            return;
        }

        await MessageUtils.send(
            intr.user,
            Lang.getEmbed('info', 'premium.subscriptionPM', data.lang(), {
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
            Lang.getEmbed('info', 'premium.subscriptionDMPrompt', data.lang())
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
