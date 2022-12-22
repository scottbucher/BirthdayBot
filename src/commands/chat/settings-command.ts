import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';

import { DataValidation, DateFormat, EventDataType, NameFormat } from '../../enums/index.js';
import { Language } from '../../models/enum-helpers/language.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { FormatUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

export class SettingsCommand implements Command {
    public names = [Lang.getRef('commands', 'chatCommands.settings', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireDev = false;
    public requireClientPerms: PermissionsString[] = [];
    public requireEventData: EventDataType[] = [EventDataType.GUILD_DATA];
    public dataValidation: DataValidation[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let type =
            intr.options.getString(
                Lang.getRef('commands', 'arguments.setting', Language.Default)
            ) ?? 'GENERAL';
        let guild = intr.guild;
        let guildData = data.guildData;

        if (type === 'MESSAGE') {
            // message settings
            let birthdayChannel: string;
            let memberAnniversaryChannel: string;
            let serverAnniversaryChannel: string;
            let eventChannel: string;
            let birthdayMessageTime: string;
            let memberAnniversaryMessageTime: string;
            let serverAnniversaryMessageTime: string;
            let birthdayPing: string;
            let memberAnniversaryPing: string;
            let serverAnniversaryPing: string;
            let eventPing: string;
            let birthdayPostMode: string;
            let memberAnniversaryPostMode: string;
            let serverAnniversaryPostMode: string;
            let eventPostMode: string;

            birthdayChannel = !guildData.birthdaySettings.channelDiscordId
                ? Lang.getRef('info', 'terms.notSet', data.lang)
                : guild.channels.resolve(guildData.birthdaySettings.channelDiscordId)?.toString() ||
                  `**${Lang.getRef('info', 'terms.deletedChannel', data.lang)}**`;
            memberAnniversaryChannel = !guildData.memberAnniversarySettings.channelDiscordId
                ? Lang.getRef('info', 'terms.notSet', data.lang)
                : guild.channels
                      .resolve(guildData.memberAnniversarySettings.channelDiscordId)
                      ?.toString() ||
                  `**${Lang.getRef('info', 'terms.deletedChannel', data.lang)}**`;
            serverAnniversaryChannel = !guildData.serverAnniversarySettings.channelDiscordId
                ? Lang.getRef('info', 'terms.notSet', data.lang)
                : guild.channels
                      .resolve(guildData.serverAnniversarySettings.channelDiscordId)
                      ?.toString() ||
                  `**${Lang.getRef('info', 'terms.deletedChannel', data.lang)}**`;
            eventChannel = !guildData.eventSettings.channelDiscordId
                ? Lang.getRef('info', 'terms.notSet', data.lang)
                : guild.channels.resolve(guildData.eventSettings.channelDiscordId)?.toString() ||
                  `**${Lang.getRef('info', 'terms.deletedChannel', data.lang)}**`;

            // Get our mention settings
            birthdayPing =
                guildData.birthdaySettings.ping ?? Lang.getRef('info', 'terms.notSet', data.lang);

            memberAnniversaryPing =
                guildData.memberAnniversarySettings.ping ??
                Lang.getRef('info', 'terms.notSet', data.lang);

            serverAnniversaryPing =
                guildData.serverAnniversarySettings.ping ??
                Lang.getRef('info', 'terms.notSet', data.lang);

            eventPing =
                guildData.eventSettings.ping ?? Lang.getRef('info', 'terms.notSet', data.lang);

            // Get Message Time
            birthdayMessageTime = FormatUtils.getMessageTime(
                guildData.birthdaySettings.postHour,
                data.lang
            );
            memberAnniversaryMessageTime = FormatUtils.getMessageTime(
                guildData.memberAnniversarySettings.postHour,
                data.lang
            );
            serverAnniversaryMessageTime = FormatUtils.getMessageTime(
                guildData.serverAnniversarySettings.postHour,
                data.lang
            );

            // Get Post Mode
            birthdayPostMode = FormatUtils.getPostModeDisplay(
                guildData.birthdaySettings.postMode,
                data.lang
            );
            memberAnniversaryPostMode = FormatUtils.getPostModeDisplay(
                guildData.memberAnniversarySettings.postMode,
                data.lang
            );
            serverAnniversaryPostMode = FormatUtils.getPostModeDisplay(
                guildData.serverAnniversarySettings.postMode,
                data.lang
            );
            eventPostMode = FormatUtils.getPostModeDisplay(
                guildData.eventSettings.postMode,
                data.lang
            );

            await InteractionUtils.send(
                intr,
                Lang.getEmbed('info', 'settings.message', data.lang, {
                    SERVER_NAME: guild.name,
                    BIRTHDAY_CHANNEL: birthdayChannel,
                    BIRTHDAY_MESSAGE_TIME: birthdayMessageTime,
                    BIRTHDAY_PING: birthdayPing,
                    BIRTHDAY_POST_MODE: birthdayPostMode,
                    MEMBER_ANNIVERSARY_CHANNEL: memberAnniversaryChannel,
                    MEMBER_ANNIVERSARY_PING: memberAnniversaryPing,
                    MEMBER_ANNIVERSARY_MESSAGE_TIME: memberAnniversaryMessageTime,
                    MEMBER_ANNIVERSARY_POST_MODE: memberAnniversaryPostMode,
                    SERVER_ANNIVERSARY_CHANNEL: serverAnniversaryChannel,
                    SERVER_ANNIVERSARY_PING: serverAnniversaryPing,
                    SERVER_ANNIVERSARY_MESSAGE_TIME: serverAnniversaryMessageTime,
                    SERVER_ANNIVERSARY_POST_MODE: serverAnniversaryPostMode,
                    EVENT_CHANNEL: eventChannel,
                    EVENT_PING: eventPing,
                    EVENT_POST_MODE: eventPostMode,
                    GUILD_ID: guild.id,
                    HAS_PREMIUM: Lang.getRef(
                        'info',
                        'terms.' + (guildData.premium.active ? 'active' : 'notActive'),
                        data.lang
                    ),
                    DATE: new Date().getFullYear().toString(),
                    ICON: intr.client.user.displayAvatarURL(),
                })
            );
        } else if (type === 'ADVANCED') {
            // advanced settings
            let preventsRole = Lang.getRef(
                'info',
                'boolean.' + (guildData.trustedSystemSettings.requireForRole ? 'true' : 'false'),
                data.lang
            );
            let preventsMessage = Lang.getRef(
                'info',
                'boolean.' + (guildData.trustedSystemSettings.requireForMessage ? 'true' : 'false'),
                data.lang
            );
            let preventsPing = Lang.getRef(
                'info',
                'boolean.' + (guildData.trustedSystemSettings.requireForPing ? 'true' : 'false'),
                data.lang
            );
            let requireAllTrustedRoles = Lang.getRef(
                'info',
                'boolean.' + (guildData.trustedSystemSettings.requireAll ? 'true' : 'false'),
                data.lang
            );
            let useTimezone = Lang.getRef(
                'info',
                'terms.' + data.guildData.birthdaySettings.useTimeZone.toLowerCase(),
                data.lang
            );

            let dateFormat =
                guildData.formatSettings.date === DateFormat.MONTH_DAY
                    ? Lang.getRef('info', 'terms.monthDay', data.lang)
                    : Lang.getRef('info', 'terms.dayMonth', data.lang);

            let trustedRoleCount = guildData.trustedSystemSettings.roleIds.length;

            await InteractionUtils.send(
                intr,
                Lang.getEmbed('info', 'settings.advanced', data.lang, {
                    SERVER_NAME: guild.name,
                    TRUSTED_PREVENTS_ROLE: preventsRole,
                    TRUSTED_PREVENTS_MESSAGE: preventsMessage,
                    TRUSTED_PREVENTS_PING: preventsPing,
                    REQUIRE_ALL_TRUSTED_ROLES: requireAllTrustedRoles,
                    TRUSTED_ROLE_COUNT: trustedRoleCount.toString(),
                    USE_TIMEZONE: useTimezone,
                    DATE_FORMAT: dateFormat,
                    GUILD_ID: guild.id,
                    HAS_PREMIUM: Lang.getRef(
                        'info',
                        'terms.' + (guildData.premium.active ? 'active' : 'notActive'),
                        data.lang
                    ),
                    DATE: new Date().getFullYear().toString(),
                    ICON: intr.client.user.displayAvatarURL(),
                })
            );
        } else {
            // general settings
            let birthdayRole: string;
            birthdayRole = !guildData.birthdaySettings.roleDiscordId
                ? Lang.getRef('info', 'terms.notSet', data.lang)
                : guild.roles.resolve(guildData.birthdaySettings.roleDiscordId)?.toString() ||
                  `**${Lang.getRef('info', 'terms.deletedRole', data.lang)}**`;

            let nameFormat =
                guildData.formatSettings.name === NameFormat.MENTION
                    ? Lang.getRef('info', 'terms.mention', data.lang)
                    : guildData.formatSettings.name === NameFormat.NICKNAME
                    ? Lang.getRef('info', 'terms.name', data.lang)
                    : guildData.formatSettings.name === NameFormat.USERNAME
                    ? Lang.getRef('info', 'terms.username', data.lang)
                    : Lang.getRef('info', 'terms.tag', data.lang);

            let defaultTimezone = !guildData.guildSettings.timeZone
                ? Lang.getRef('info', 'terms.notSet', data.lang)
                : guildData.guildSettings.timeZone;
            let serverLanguage = Language.Data[guildData.guildSettings.language].nativeName;

            await InteractionUtils.send(
                intr,
                Lang.getEmbed('info', 'settings.general', data.lang, {
                    SERVER_NAME: guild.name,
                    BIRTHDAY_ROLE: birthdayRole,
                    NAME_FORMAT: nameFormat,
                    DEFAULT_TIMEZONE: defaultTimezone,
                    SERVER_LANGUAGE: serverLanguage,
                    GUILD_ID: guild.id,
                    HAS_PREMIUM: Lang.getRef(
                        'info',
                        'terms.' + (guildData.premium.active ? 'active' : 'notActive'),
                        data.lang
                    ),
                    DATE: new Date().getFullYear().toString(),
                    ICON: intr.client.user.displayAvatarURL(),
                })
            );
        }
    }
}
