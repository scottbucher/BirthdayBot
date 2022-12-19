import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';
import { DateTime } from 'luxon';
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

export class PremiumCommand implements Command {
    public names = [Lang.getRef('commands', 'chatCommands.premium', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireDev = false;
    public requireClientPerms: PermissionsString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requireEventData: EventDataType[] = [];
    public dataValidation: DataValidation[] = [];

    constructor(private subService: SubscriptionService) {}

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        if (!Config.payments.enabled) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('info', 'premium.premiumDisabled', data.lang)
            );
            return;
        }
        let subStatus = await this.subService.getSubscription(PlanName.premium1, intr.guild.id);

        if (!subStatus || !subStatus.service) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('info', 'premium.noSubscription', data.lang, {
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

        let lastPayment = DateTime.fromISO(subStatus.subscription.times.lastPayment);
        let paidUntil = DateTime.fromISO(subStatus.subscription.times.paidUntil);

        let na = Lang.getRef('info', 'terms.na', data.lang);
        await InteractionUtils.send(
            intr,
            Lang.getEmbed('info', 'premium.subscription', data.lang, {
                IS_ACTIVE: Lang.getRef(
                    'info',
                    'boolean.' + (subStatus.service ? 'yes' : 'no'),
                    data.lang
                ),
                SUBSCRIPTION_ID: subStatus.subscription.id
                    ? `[${subStatus.subscription.id}](${Lang.getCom('links.autopay')}/connect/${
                          subStatus.subscription.id
                      })`
                    : na,
                STATUS: subStatus.subscription.status ?? na,
                LAST_PAYMENT: lastPayment?.toFormat('MMMM DD, YYYY, HH:mm UTC') ?? na,
                PAID_UNTIL: paidUntil?.toFormat('MMMM DD, YYYY, HH:mm UTC') ?? na,
            })
        );
        return;
    }
}
