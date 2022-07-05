import {
    ApplicationCommandOptionType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import { CommandInteraction, Permissions, PermissionString } from 'discord.js';

import { Language } from '../models/enum-helpers/index.js';
import { EventData } from '../models/index.js';
import { TrustedRoleRepo } from '../services/database/repos/index.js';
import { Lang } from '../services/index.js';
import { FormatUtils, InteractionUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class SettingsCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.settings'),
        description: 'View the settings for this server.',
        dm_permission: false,
        default_member_permissions: Permissions.resolve([
            Permissions.FLAGS.ADMINISTRATOR,
        ]).toString(),
        options: [
            {
                name: Lang.getCom('arguments.setting'),
                description: 'The settings to view. Defaults to general.',
                required: false,
                type: ApplicationCommandOptionType.String.valueOf(),
                choices: [
                    {
                        name: 'general',
                        value: 'GENERAL',
                    },
                    {
                        name: 'message',
                        value: 'MESSAGE',
                    },
                    {
                        name: 'advanced',
                        value: 'ADVANCED',
                    },
                ],
            },
        ],
    };
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    constructor(public trustedRoleRepo: TrustedRoleRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let type = intr.options.getString(Lang.getCom('arguments.setting')) ?? 'GENERAL';
        let guild = intr.guild;

        if (type === 'MESSAGE') {
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
                data.guild.BirthdayChannelDiscordId === '0'
                    ? Lang.getRef('info', 'terms.notSet', data.lang())
                    : guild.channels.resolve(data.guild.BirthdayChannelDiscordId)?.toString() ||
                      `**${Lang.getRef('info', 'terms.deletedChannel', data.lang())}**`;
            memberAnniversaryChannel =
                data.guild.MemberAnniversaryChannelDiscordId === '0'
                    ? Lang.getRef('info', 'terms.notSet', data.lang())
                    : guild.channels
                          .resolve(data.guild.MemberAnniversaryChannelDiscordId)
                          ?.toString() ||
                      `**${Lang.getRef('info', 'terms.deletedChannel', data.lang())}**`;
            serverAnniversaryChannel =
                data.guild.ServerAnniversaryChannelDiscordId === '0'
                    ? Lang.getRef('info', 'terms.notSet', data.lang())
                    : guild.channels
                          .resolve(data.guild.ServerAnniversaryChannelDiscordId)
                          ?.toString() ||
                      `**${Lang.getRef('info', 'terms.deletedChannel', data.lang())}**`;

            // Get our mention settings
            birthdayMentionSetting = FormatUtils.getMentionSetting(
                data.guild.BirthdayMentionSetting,
                guild
            );
            if (birthdayMentionSetting === 'none')
                birthdayMentionSetting = Lang.getRef('info', 'terms.notSet', data.lang());
            memberAnniversaryMentionSetting = FormatUtils.getMentionSetting(
                data.guild.MemberAnniversaryMentionSetting,
                guild
            );
            if (memberAnniversaryMentionSetting === 'none')
                memberAnniversaryMentionSetting = Lang.getRef('info', 'terms.notSet', data.lang());
            serverAnniversaryMentionSetting = FormatUtils.getMentionSetting(
                data.guild.ServerAnniversaryMentionSetting,
                guild
            );
            if (serverAnniversaryMentionSetting === 'none')
                serverAnniversaryMentionSetting = Lang.getRef('info', 'terms.notSet', data.lang());

            // Get Message Time
            birthdayMessageTime = FormatUtils.getMessageTime(data.guild.BirthdayMessageTime);
            memberAnniversaryMessageTime = FormatUtils.getMessageTime(
                data.guild.MemberAnniversaryMessageTime
            );
            serverAnniversaryMessageTime = FormatUtils.getMessageTime(
                data.guild.ServerAnniversaryMessageTime
            );

            await InteractionUtils.send(
                intr,
                Lang.getEmbed('info', 'settings.message', data.lang(), {
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
                        'info',
                        'terms.' + (data.hasPremium ? 'active' : 'notActive'),
                        data.lang()
                    ),
                    DATE: new Date().getFullYear().toString(),
                    ICON: intr.client.user.displayAvatarURL(),
                })
            );
        } else if (type === 'ADVANCED') {
            // advanced settings
            let preventsRole = Lang.getRef(
                'info',
                'boolean.' + (data.guild.TrustedPreventsRole ? 'true' : 'false'),
                data.lang()
            );
            let preventsMessage = Lang.getRef(
                'info',
                'boolean.' + (data.guild.TrustedPreventsMessage ? 'true' : 'false'),
                data.lang()
            );
            let requireAllTrustedRoles = Lang.getRef(
                'info',
                'boolean.' + (data.guild.RequireAllTrustedRoles ? 'true' : 'false'),
                data.lang()
            );
            let useTimezone = Lang.getRef('info', 'terms.' + data.guild.UseTimezone, data.lang());

            let dateFormat = data.guild.DateFormat === 'month_day' ? 'Month/Day' : 'Day/Month';

            let trustedRoleCount =
                (await this.trustedRoleRepo.getTrustedRoles(guild.id))?.trustedRoles.length ?? 0;

            await InteractionUtils.send(
                intr,
                Lang.getEmbed('info', 'settings.advanced', data.lang(), {
                    SERVER_NAME: guild.name,
                    TRUSTED_PREVENTS_ROLE: preventsRole,
                    TRUSTED_PREVENTS_MESSAGE: preventsMessage,
                    REQUIRE_ALL_TRUSTED_ROLES: requireAllTrustedRoles,
                    TRUSTED_ROLE_COUNT: trustedRoleCount.toString(),
                    USE_TIMEZONE: useTimezone,
                    DATE_FORMAT: dateFormat,
                    GUILD_ID: guild.id,
                    HAS_PREMIUM: Lang.getRef(
                        'info',
                        'terms.' + (data.hasPremium ? 'active' : 'notActive'),
                        data.lang()
                    ),
                    DATE: new Date().getFullYear().toString(),
                    ICON: intr.client.user.displayAvatarURL(),
                })
            );
        } else {
            // general settings
            let birthdayRole: string;
            birthdayRole =
                data.guild.BirthdayRoleDiscordId === '0'
                    ? Lang.getRef('info', 'terms.notSet', data.lang())
                    : guild.roles.resolve(data.guild.BirthdayRoleDiscordId)?.toString() ||
                      `**${Lang.getRef('info', 'terms.deletedRole', data.lang())}**`;

            let nameFormat =
                data.guild.NameFormat.charAt(0).toUpperCase() + data.guild.NameFormat.slice(1);
            let defaultTimezone =
                data.guild.DefaultTimezone === '0'
                    ? Lang.getRef('info', 'terms.notSet', data.lang())
                    : data.guild.DefaultTimezone;
            let serverLanguage = Language.displayName(data.lang());

            await InteractionUtils.send(
                intr,
                Lang.getEmbed('info', 'settings.general', data.lang(), {
                    SERVER_NAME: guild.name,
                    BIRTHDAY_ROLE: birthdayRole,
                    NAME_FORMAT: nameFormat,
                    DEFAULT_TIMEZONE: defaultTimezone,
                    SERVER_LANGUAGE: serverLanguage,
                    GUILD_ID: guild.id,
                    HAS_PREMIUM: Lang.getRef(
                        'info',
                        'terms.' + (data.hasPremium ? 'active' : 'notActive'),
                        data.lang()
                    ),
                    DATE: new Date().getFullYear().toString(),
                    ICON: intr.client.user.displayAvatarURL(),
                })
            );
        }
    }
}
