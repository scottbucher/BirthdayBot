import { FormatUtils, MessageUtils } from '../utils';
import { LangCode, Language } from '../models/enums';
import { Message, TextChannel } from 'discord.js';

import { Command } from './command';
import { GuildRepo } from '../services/database/repos';
import { Lang } from '../services';

export class SettingsCommand implements Command {
    public name: string = 'settings';
    public aliases = ['setting'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = true;

    constructor(private guildRepo: GuildRepo) {}

    async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
        let guild = msg.guild;
        let guildData = await this.guildRepo.getGuild(guild.id);

        let type =
            args.length > 2
                ? FormatUtils.extractMiscActionType(args[2].toLowerCase())?.toLowerCase() ??
                  'general'
                : 'general';

        // split settings into general settings, message settings, advanced settings
        // bday settings [option]
        if (type === 'message') {
            // message settings
            let birthdayChannel: string;
            let memberAnniversaryChannel: string;
            let serverAnniversaryChannel: string;
            let birthdayMessageTime: string;
            let memberAnniversaryMessageTime: string;
            let serverAnniversaryMessageTime: string;
            let birthdayMentionSetting: string;
            let memberAnniversaryMentionSetting: string;
            let serverAnniversaryMentionSetting: string;
            birthdayChannel =
                guildData.BirthdayChannelDiscordId === '0'
                    ? Lang.getRef('terms.notSet', LangCode.EN_US)
                    : guild.channels.resolve(guildData.BirthdayChannelDiscordId)?.toString() ||
                      `**${Lang.getRef('terms.deletedChannel', LangCode.EN_US)}**`;
            memberAnniversaryChannel =
                guildData.MemberAnniversaryChannelDiscordId === '0'
                    ? Lang.getRef('terms.notSet', LangCode.EN_US)
                    : guild.channels
                          .resolve(guildData.MemberAnniversaryChannelDiscordId)
                          ?.toString() ||
                      `**${Lang.getRef('terms.deletedChannel', LangCode.EN_US)}**`;
            serverAnniversaryChannel =
                guildData.ServerAnniversaryChannelDiscordId === '0'
                    ? Lang.getRef('terms.notSet', LangCode.EN_US)
                    : guild.channels
                          .resolve(guildData.ServerAnniversaryChannelDiscordId)
                          ?.toString() ||
                      `**${Lang.getRef('terms.deletedChannel', LangCode.EN_US)}**`;

            // Get our mention settings
            birthdayMentionSetting = FormatUtils.getMentionSetting(
                guildData.BirthdayMentionSetting,
                guild
            );
            if (birthdayMentionSetting === 'none')
                birthdayMentionSetting = Lang.getRef('terms.notSet', LangCode.EN_US);
            memberAnniversaryMentionSetting = FormatUtils.getMentionSetting(
                guildData.MemberAnniversaryMentionSetting,
                guild
            );
            if (memberAnniversaryMentionSetting === 'none')
                memberAnniversaryMentionSetting = Lang.getRef('terms.notSet', LangCode.EN_US);
            serverAnniversaryMentionSetting = FormatUtils.getMentionSetting(
                guildData.ServerAnniversaryMentionSetting,
                guild
            );
            if (serverAnniversaryMentionSetting === 'none')
                serverAnniversaryMentionSetting = Lang.getRef('terms.notSet', LangCode.EN_US);

            // Get Message Time
            birthdayMessageTime = FormatUtils.getMessageTime(guildData.BirthdayMessageTime);
            memberAnniversaryMessageTime = FormatUtils.getMessageTime(
                guildData.MemberAnniversaryMessageTime
            );
            serverAnniversaryMessageTime = FormatUtils.getMessageTime(
                guildData.ServerAnniversaryMessageTime
            );

            await MessageUtils.send(
                channel,
                Lang.getEmbed('info.settingsMessage', LangCode.EN_US, {
                    SERVER_NAME: guild.name,
                    BIRTHDAY_CHANNEL: birthdayChannel,
                    BIRTHDAY_MESSAGE_TIME: birthdayMessageTime,
                    BIRTHDAY_MENTION: birthdayMentionSetting,
                    MEMBER_ANNIVERSARY_CHANNEL: memberAnniversaryChannel,
                    MEMBER_ANNIVERSARY_MENTION: memberAnniversaryMentionSetting,
                    MEMBER_ANNIVERSARY_MESSAGE_TIME: memberAnniversaryMessageTime,
                    SERVER_ANNIVERSARY_CHANNEL: serverAnniversaryChannel,
                    SERVER_ANNIVERSARY_MENTION: serverAnniversaryMentionSetting,
                    SERVER_ANNIVERSARY_MESSAGE_TIME: serverAnniversaryMessageTime,
                    GUILD_ID: guild.id,
                    HAS_PREMIUM: Lang.getRef(
                        'terms.' + (hasPremium ? 'active' : 'notActive'),
                        LangCode.EN_US
                    ),
                    DATE: new Date().getFullYear().toString(),
                })
            );
        } else if (type === 'advanced') {
            // advanced settings
            let birthdayMasterRole: string;
            let preventsRole = Lang.getRef(
                'boolean.' + (guildData.TrustedPreventsRole ? 'true' : 'false'),
                LangCode.EN_US
            );
            let preventsMessage = Lang.getRef(
                'boolean.' + (guildData.TrustedPreventsMessage ? 'true' : 'false'),
                LangCode.EN_US
            );
            let requireAllTrustedRoles = Lang.getRef(
                'boolean.' + (guildData.RequireAllTrustedRoles ? 'true' : 'false'),
                LangCode.EN_US
            );
            let useTimezone = Lang.getRef('terms.' + guildData.UseTimezone, LangCode.EN_US);
            birthdayMasterRole =
                guildData.BirthdayMasterRoleDiscordId === '0'
                    ? Lang.getRef('terms.notSet', LangCode.EN_US)
                    : guild.roles.resolve(guildData.BirthdayMasterRoleDiscordId)?.toString() ||
                      `**${Lang.getRef('terms.deletedRole', LangCode.EN_US)}**`;

            await MessageUtils.send(
                channel,
                Lang.getEmbed('info.settingsAdvanced', LangCode.EN_US, {
                    SERVER_NAME: guild.name,
                    BIRTHDAY_MASTER_ROLE: birthdayMasterRole,
                    TRUSTED_PREVENTS_ROLE: preventsRole,
                    TRUSTED_PREVENTS_MESSAGE: preventsMessage,
                    REQUIRE_ALL_TRUSTED_ROLES: requireAllTrustedRoles,
                    USE_TIMEZONE: useTimezone,
                    GUILD_ID: guild.id,
                    HAS_PREMIUM: Lang.getRef(
                        'terms.' + (hasPremium ? 'active' : 'notActive'),
                        LangCode.EN_US
                    ),
                    DATE: new Date().getFullYear().toString(),
                })
            );
        } else {
            // general settings
            let birthdayRole: string;
            birthdayRole =
                guildData.BirthdayRoleDiscordId === '0'
                    ? Lang.getRef('terms.notSet', LangCode.EN_US)
                    : guild.roles.resolve(guildData.BirthdayRoleDiscordId)?.toString() ||
                      `**${Lang.getRef('terms.deletedRole', LangCode.EN_US)}**`;

            let nameFormat =
                guildData.NameFormat.charAt(0).toUpperCase() + guildData.NameFormat.slice(1);
            let defaultTimezone =
                guildData.DefaultTimezone === '0'
                    ? Lang.getRef('terms.notSet', LangCode.EN_US)
                    : guildData.DefaultTimezone;
            let serverLanguage = Language.displayName(LangCode.EN_US);

            await MessageUtils.send(
                channel,
                Lang.getEmbed('info.settingsGeneral', LangCode.EN_US, {
                    SERVER_NAME: guild.name,
                    BIRTHDAY_ROLE: birthdayRole,
                    NAME_FORMAT: nameFormat,
                    DEFAULT_TIMEZONE: defaultTimezone,
                    SERVER_LANGUAGE: serverLanguage,
                    GUILD_ID: guild.id,
                    HAS_PREMIUM: Lang.getRef(
                        'terms.' + (hasPremium ? 'active' : 'notActive'),
                        LangCode.EN_US
                    ),
                    DATE: new Date().getFullYear().toString(),
                })
            );
        }
    }
}
