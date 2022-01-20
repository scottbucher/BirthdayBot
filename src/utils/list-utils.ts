import { Guild, GuildMember, MessageEmbed } from 'discord.js';
import moment from 'moment';
import { createRequire } from 'node:module';

import {
    Blacklisted,
    CustomMessages,
    GuildData,
    UserDataResults,
} from '../models/database/index.js';
import { MemberAnniversaryRoles } from '../models/database/member-anniversary-role-models.js';
import { TrustedRoles } from '../models/database/trusted-role-models.js';
import { EventData } from '../models/internal-models.js';
import { Lang } from '../services/index.js';
import { CelebrationUtils } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
// Class which handles list embed generation
export class ListUtils {
    public static async getCustomMessageListEmbed(
        guild: Guild,
        customMessageResults: CustomMessages,
        page: number,
        pageSize: number,
        hasPremium: boolean,
        type: string,
        data: EventData
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;

        let i = (page - 1) * pageSize + 1;

        let description = '';

        if (customMessageResults.customMessages.length === 0) {
            description += Lang.getRef('info', 'list.emptyList', data.lang());
        }

        let maxMessagesFree: number =
            type === 'member_anniversary'
                ? Config.validation.message.maxCount.memberAnniversary.free
                : type === 'server_anniversary'
                ? Config.validation.message.maxCount.serverAnniversary.free
                : Config.validation.message.maxCount.birthday.free;
        let maxMessagesPaid: number =
            type === 'member_anniversary'
                ? Config.validation.message.maxCount.memberAnniversary.paid
                : type === 'server_anniversary'
                ? Config.validation.message.maxCount.serverAnniversary.paid
                : Config.validation.message.maxCount.birthday.paid;

        for (let customMessage of customMessageResults.customMessages) {
            // dynamically check which ones to cross out due to the server not having premium anymore
            if (hasPremium || customMessage.Position <= maxMessagesFree) {
                description += `**${i.toLocaleString()}.** ${customMessage.Message}\n`;
            } else {
                description += `**${i.toLocaleString()}.** ~~${customMessage.Message}~~\n`;
            }

            // Added embedded part
            description += ` - **${Lang.getRef('info', 'terms.embedded', data.lang())}**: ${
                customMessage.Embed
                    ? Lang.getRef('info', 'boolean.true', data.lang())
                    : Lang.getRef('info', 'boolean.false', data.lang())
            }\n`;

            if (!hasPremium && customMessage.Color !== '0') description += '~~';
            // Added color part
            description += ` - **${Lang.getRef('info', 'terms.color', data.lang())}**: #${
                customMessage.Color === '0'
                    ? Config.colors.default.substring(1).toUpperCase()
                    : customMessage.Color
            }`;
            if (!hasPremium && customMessage.Color !== '0') description += '~~';
            description += '\n\n';
            i++;
        }

        let listEmbed = 'list.';

        if (!hasPremium && customMessageResults.stats.TotalItems > maxMessagesFree) {
            listEmbed +=
                type === 'member_anniversary'
                    ? 'memberAnniversaryMessageLocked'
                    : type === 'server_anniversary'
                    ? 'serverAnniversaryMessageLocked'
                    : 'birthdayMessageLocked';
            embed = Lang.getEmbed('info', listEmbed, data.lang(), {
                PAGE: `${page > 0 ? page.toString() : '1'}`,
                LIST_DATA: description,
                TOTAL_PAGES: `${
                    customMessageResults.stats.TotalPages > 0
                        ? customMessageResults.stats.TotalPages.toString()
                        : '1'
                }`,
                TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.birthdayMessageListSize.toString(),
                MAX_FREE: maxMessagesFree.toString(),
                MAX_PAID: maxMessagesPaid.toString(),
                ICON: guild.client.user.displayAvatarURL(),
            });
        } else {
            listEmbed +=
                type === 'member_anniversary'
                    ? 'memberAnniversaryMessageUnLocked'
                    : type === 'server_anniversary'
                    ? 'serverAnniversaryMessageUnLocked'
                    : 'birthdayMessageUnLocked';
            embed = Lang.getEmbed('info', listEmbed, data.lang(), {
                PAGE: `${page > 0 ? page.toString() : '1'}`,
                LIST_DATA: description,
                TOTAL_PAGES: `${
                    customMessageResults.stats.TotalPages > 0
                        ? customMessageResults.stats.TotalPages.toString()
                        : '1'
                }`,
                TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.birthdayMessageListSize.toString(),
                ICON: guild.client.user.displayAvatarURL(),
            });
        }

        return embed.setThumbnail(guild.iconURL());
    }

    // TODO: update placeholders with regex and test
    public static async getCustomUserMessageListEmbed(
        guild: Guild,
        customMessageResults: CustomMessages,
        page: number,
        pageSize: number,
        hasPremium: boolean,
        type: string,
        data: EventData
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;

        let description = '';

        if (customMessageResults.customMessages.length === 0) {
            description += Lang.getRef('info', 'list.emptyList', data.lang());
        }

        for (let customMessage of customMessageResults.customMessages) {
            let member = guild.members.resolve(customMessage.UserDiscordId);
            if (hasPremium) {
                description += `${
                    member
                        ? `**${member.displayName}**: `
                        : `**${Lang.getRef('info', 'terms.unknownMember', data.lang())}** `
                } ${customMessage.Message.replace(
                    Lang.getRef('info', 'placeHolders.usersRegex', data.lang()),
                    member.toString()
                )}\n`;
            } else {
                description += `${
                    member
                        ? `**${member.displayName}**: `
                        : `**${Lang.getRef('info', 'terms.unknownMember', data.lang())}** `
                } ~~${customMessage.Message.replace(
                    Lang.getRef('info', 'placeHolders.usersRegex', data.lang()),
                    member.toString()
                )}~~\n`;
            }

            // Added embedded part
            description += ` - **${Lang.getRef('info', 'terms.embedded', data.lang())}**: ${
                customMessage.Embed
                    ? Lang.getRef('info', 'boolean.true', data.lang())
                    : Lang.getRef('info', 'boolean.false', data.lang())
            }\n`;

            if (!hasPremium && customMessage.Color !== '0') description += '~~';
            // Added color part
            description += ` - **${Lang.getRef('info', 'terms.color', data.lang())}**: #${
                customMessage.Color === '0'
                    ? Config.colors.default.substring(1).toUpperCase()
                    : customMessage.Color
            }`;
            if (!hasPremium && customMessage.Color !== '0') description += '~~';
            description += '\n\n';
        }

        let listEmbed = 'list.';

        if (!hasPremium) {
            listEmbed +=
                type === 'member_anniversary'
                    ? 'userSpecificMemberAnniversaryMessageLocked'
                    : 'userSpecificBirthdayMessageLocked';
            embed = Lang.getEmbed('info', listEmbed, data.lang(), {
                PAGE: `${page > 0 ? page.toString() : '1'}`,
                LIST_DATA: description,
                TOTAL_PAGES: `${
                    customMessageResults.stats.TotalPages > 0
                        ? customMessageResults.stats.TotalPages.toString()
                        : '1'
                }`,
                TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.birthdayMessageListSize.toString(),
                ICON: guild.client.user.displayAvatarURL(),
            });
        } else {
            listEmbed +=
                type === 'member_anniversary'
                    ? 'userSpecificMemberAnniversaryMessageUnLocked'
                    : 'userSpecificBirthdayMessageUnLocked';
            embed = Lang.getEmbed('info', listEmbed, data.lang(), {
                PAGE: `${page > 0 ? page.toString() : '1'}`,
                LIST_DATA: description,
                TOTAL_PAGES: `${
                    customMessageResults.stats.TotalPages > 0
                        ? customMessageResults.stats.TotalPages.toString()
                        : '1'
                }`,
                TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.birthdayMessageListSize.toString(),
                ICON: guild.client.user.displayAvatarURL(),
            });
        }

        return embed;
    }

    public static async getTrustedRoleListEmbed(
        guild: Guild,
        trustedRoleResults: TrustedRoles,
        page: number,
        pageSize: number,
        hasPremium: boolean,
        data: EventData
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;

        let i = (page - 1) * pageSize + 1;

        let description = '';

        if (trustedRoleResults.trustedRoles.length === 0) {
            description += Lang.getRef('info', 'list.emptyList', data.lang());
        }

        for (let trustedRole of trustedRoleResults.trustedRoles) {
            // dynamically check which ones to cross out due to the server not having premium anymore
            let role = guild.roles.resolve(trustedRole.TrustedRoleDiscordId);
            if (
                hasPremium ||
                trustedRole.Position <= Config.validation.trustedRoles.maxCount.free
            ) {
                description += `**${i.toLocaleString()}.** ${
                    role
                        ? `${role.toString()}`
                        : `**${Lang.getRef('info', 'terms.deletedRole', data.lang())}**`
                }: (ID: ${trustedRole.TrustedRoleDiscordId})\n\n`;
            } else {
                description += `**${i.toLocaleString()}.** ${
                    role
                        ? `~~${role.toString()}~~`
                        : `~~**${Lang.getRef('info', 'terms.deletedRole', data.lang())}**~~`
                }: (ID: ${trustedRole.TrustedRoleDiscordId})\n\n`;
            }
            i++;
        }

        if (
            !hasPremium &&
            trustedRoleResults.stats.TotalItems > Config.validation.trustedRoles.maxCount.free
        ) {
            embed = Lang.getEmbed('info', 'list.trustedRolePaid', data.lang(), {
                PAGE: `${page > 0 ? page.toString() : '1'}`,
                LIST_DATA: description,
                TOTAL_PAGES: `${
                    trustedRoleResults.stats.TotalPages > 0
                        ? trustedRoleResults.stats.TotalPages.toString()
                        : '1'
                }`,
                TOTAL_ROLES: trustedRoleResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.trustedRoleListSize.toString(),
                MAX_FREE: Config.validation.trustedRoles.maxCount.free.toString(),
                MAX_PAID: Config.validation.trustedRoles.maxCount.paid.toString(),
                ICON: guild.client.user.displayAvatarURL(),
            });
        } else {
            embed = Lang.getEmbed('info', 'list.trustedRoleFree', data.lang(), {
                PAGE: `${page > 0 ? page.toString() : '1'}`,
                LIST_DATA: description,
                TOTAL_PAGES: `${
                    trustedRoleResults.stats.TotalPages > 0
                        ? trustedRoleResults.stats.TotalPages.toString()
                        : '1'
                }`,
                TOTAL_ROLES: trustedRoleResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.trustedRoleListSize.toString(),
                ICON: guild.client.user.displayAvatarURL(),
            });
        }

        return embed.setThumbnail(guild.iconURL());
    }

    public static async getBirthdayListFullEmbed(
        guild: Guild,
        userDataResults: UserDataResults,
        guildData: GuildData,
        page: number,
        pageSize: number,
        data: EventData
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;
        let description = '';

        if (userDataResults.userData.length === 0) {
            description += Lang.getRef('info', 'list.emptyList', data.lang());
        }

        let birthdays = [
            ...new Set(
                userDataResults.userData.map(data => moment(data.Birthday).format('MMMM Do'))
            ),
        ]; // remove duplicates

        // Go through the list of birthdays
        for (let birthday of birthdays) {
            let users = userDataResults.userData.filter(
                data => moment(data.Birthday).format('MMMM Do') === birthday
            ); // Get all users with this birthday to create the sub list

            let members = guild.members.cache
                .filter(m => users.map(u => u.UserDiscordId).includes(m.id))
                .map(member => member);

            let userList = CelebrationUtils.getUserListString(guildData, members); // Get the sub list of usernames for this date
            description += `__**${birthday}**__: ${userList}\n`; // Append the description
        }

        embed = Lang.getEmbed('info', 'list.birthday', data.lang(), {
            PAGE: `${page > 0 ? page.toString() : '1'}`,
            LIST_DATA: description,
            TOTAL_PAGES: `${
                userDataResults.stats.TotalPages > 0
                    ? userDataResults.stats.TotalPages.toString()
                    : '1'
            }`,
            TOTAL_BIRTHDAYS: userDataResults.stats.TotalItems.toString(),
            PER_PAGE: pageSize.toString(),
            ICON: guild.client.user.displayAvatarURL(),
        });

        return embed.setThumbnail(guild.iconURL());
    }

    public static async getMemberAnniversaryListFullEmbed(
        guild: Guild,
        guildMembers: GuildMember[],
        guildData: GuildData,
        page: number,
        pageSize: number,
        totalPages: number,
        totalMembers: number,
        data: EventData
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;
        let description = '';

        if (guildMembers.length === 0) {
            description += Lang.getRef('info', 'list.emptyList', data.lang());
        }

        let anniversaries = [
            ...new Set(guildMembers.map(m => moment(m.joinedAt).format('MMMM Do'))),
        ]; // remove duplicates

        // Go through the list of birthdays
        for (let anniversary of anniversaries) {
            let members = guildMembers.filter(
                m => moment(m.joinedAt).format('MMMM Do') === anniversary
            ); // Get all users with this birthday to create the sub list
            let userList = CelebrationUtils.getUserListString(guildData, members); // Get the sub list of usernames for this date
            description += `__**${anniversary}**__: ${userList}\n`; // Append the description
        }

        // Update config variables and add member anniversary list message
        embed = Lang.getEmbed('info', 'list.memberAnniversary', data.lang(), {
            PAGE: `${page > 0 ? page.toString() : '1'}`,
            LIST_DATA: description,
            TOTAL_PAGES: `${totalPages > 0 ? totalPages.toString() : '1'}`,
            TOTAL_ANNIVERSARIES: totalMembers.toString(),
            PER_PAGE: pageSize.toString(),
            ICON: guild.client.user.displayAvatarURL(),
        });

        return embed.setThumbnail(guild.iconURL());
    }

    public static async getBlacklistFullEmbed(
        guild: Guild,
        blacklistResults: Blacklisted,
        page: number,
        _pageSize: number,
        data: EventData
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;

        let description = '';

        if (blacklistResults.blacklist.length === 0) {
            description += Lang.getRef('info', 'list.emptyList', data.lang());
        }

        let targets = blacklistResults.blacklist.map(data => data.DiscordId);

        for (let target of targets) {
            description += `**${
                guild.members.resolve(target)?.displayName ||
                guild.roles.resolve(target)?.toString() ||
                `**${Lang.getRef('info', 'terms.unknownTarget', data.lang())}**`
            }**: (ID: ${target})\n`; // Append the description
        }

        embed = Lang.getEmbed('info', 'list.blacklist', data.lang(), {
            PAGE: `${page > 0 ? page.toString() : '1'}`,
            LIST_DATA: description,
            TOTAL_PAGES: `${
                blacklistResults.stats.TotalPages > 0
                    ? blacklistResults.stats.TotalPages.toString()
                    : '1'
            }`,
            TOTAL_BLACKLIST: blacklistResults.stats.TotalItems.toString(),
            PER_PAGE: Config.experience.blacklistSize.toString(),
            ICON: guild.client.user.displayAvatarURL(),
        });

        return embed.setThumbnail(guild.iconURL());
    }

    public static async getMemberAnniversaryRoleListEmbed(
        guild: Guild,
        memberAnniversaryRoleResults: MemberAnniversaryRoles,
        page: number,
        pageSize: number,
        hasPremium: boolean,
        data: EventData
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;

        let description = '';

        if (memberAnniversaryRoleResults.memberAnniversaryRoles.length === 0) {
            description += Lang.getRef('info', 'list.emptyList', data.lang());
        }

        for (let memberAnniversaryRole of memberAnniversaryRoleResults.memberAnniversaryRoles) {
            // dynamically check which ones to cross out due to the server not having premium anymore
            let role = guild.roles.resolve(memberAnniversaryRole.MemberAnniversaryRoleDiscordId);
            if (
                hasPremium ||
                memberAnniversaryRole.Position <=
                    Config.validation.memberAnniversaryRoles.maxCount.free
            ) {
                description += `**Year ${memberAnniversaryRole.Year}:** ${
                    role
                        ? `${role.toString()}`
                        : `**${Lang.getRef('info', 'terms.deletedRole', data.lang())}**`
                }: (ID: ${memberAnniversaryRole.MemberAnniversaryRoleDiscordId})\n\n`;
            } else {
                description += `**Year ${memberAnniversaryRole.Year}:** ${
                    role
                        ? `~~${role.toString()}~~`
                        : `**${Lang.getRef('info', 'terms.deletedRole', data.lang())}**`
                }: (ID: ${memberAnniversaryRole.MemberAnniversaryRoleDiscordId})\n\n`;
            }
        }

        if (
            !hasPremium &&
            memberAnniversaryRoleResults.stats.TotalItems >
                Config.validation.memberAnniversaryRoles.maxCount.free
        ) {
            embed = Lang.getEmbed('info', 'list.memberAnniversaryRolePaid', data.lang(), {
                PAGE: `${page > 0 ? page.toString() : '1'}`,
                LIST_DATA: description,
                TOTAL_PAGES: `${
                    memberAnniversaryRoleResults.stats.TotalPages > 0
                        ? memberAnniversaryRoleResults.stats.TotalPages.toString()
                        : '1'
                }`,
                TOTAL_ROLES: memberAnniversaryRoleResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.memberAnniversaryRoleListSize.toString(),
                MAX_PAID: Config.validation.memberAnniversaryRoles.maxCount.paid.toString(),
                ICON: guild.client.user.displayAvatarURL(),
            });
        } else {
            embed = Lang.getEmbed('info', 'list.memberAnniversaryRoleFree', data.lang(), {
                PAGE: `${page > 0 ? page.toString() : '1'}`,
                LIST_DATA: description,
                TOTAL_PAGES: `${
                    memberAnniversaryRoleResults.stats.TotalPages > 0
                        ? memberAnniversaryRoleResults.stats.TotalPages.toString()
                        : '1'
                }`,
                TOTAL_ROLES: memberAnniversaryRoleResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.memberAnniversaryRoleListSize.toString(),
                ICON: guild.client.user.displayAvatarURL(),
            });
        }

        return embed.setThumbnail(guild.iconURL());
    }
}
