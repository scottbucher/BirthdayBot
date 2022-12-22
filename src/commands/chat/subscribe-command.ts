import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';
import { createRequire } from 'node:module';

import { DataValidation, EventDataType } from '../../enums/index.js';
import { Language } from '../../models/enum-helpers/language.js';
import { EventData } from '../../models/internal-models.js';
import { PlanName } from '../../models/subscription-models.js';
import { Lang } from '../../services/lang.js';
import { Logger } from '../../services/logger.js';
import { SubscriptionService } from '../../services/subscription-service.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');
let Logs = require('../../../lang/logs.json');

export class SubscribeCommand implements Command {
    public names = [Lang.getRef('commands', 'chatCommands.subscribe', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireClientPerms: PermissionsString[] = [];
    public requireEventData: EventDataType[] = [];
    public dataValidation: DataValidation[] = [];

    constructor(private subscriptionService: SubscriptionService) {}

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        // These are currently under info, maybe they should be moved to validation?
        if (!Config.payments.enabled) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('info', 'premium.premiumDisabled', data.lang)
            );
            return;
        }

        if (!Config.payments.allowNewTransactions) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('info', 'premium.refuseNewTransactions', data.lang)
            );
            return;
        }

        let subLink = await this.subscriptionService.createSubscription(
            PlanName.premium1,
            intr.guild.id
        );

        if (!subLink) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('info', 'premium.premiumAlreadyActive', data.lang),
                false
            );
            return;
        }

        await InteractionUtils.send(
            intr,
            Lang.getEmbed('info', 'premium.subscriptionPM', data.lang, {
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
            }),
            false
        );

        await InteractionUtils.send(
            intr,
            Lang.getEmbed('info', 'premium.subscriptionDMPrompt', data.lang),
            false
        );

        Logger.info(
            Logs.info.unsubRanSubCmd
                .replaceAll('{SENDER_TAG}', intr.user.tag)
                .replaceAll('{SENDER_ID}', intr.user.id)
                .replaceAll('{GUILD_NAME}', intr.guild.name)
                .replaceAll('{GUILD_ID}', intr.guild.id)
        );
        return;
    }
}
