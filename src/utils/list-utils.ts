import { EmbedBuilder, Guild, GuildMember } from 'discord.js';
import { DateTime } from 'luxon';
import { createRequire } from 'node:module';

import { GuildData } from '../database/entities/guild.js';
import { UserData } from '../database/entities/user.js';
import { EventData } from '../models/internal-models.js';
import { Lang } from '../services/lang.js';
import { CelebrationUtils } from './celebration-utils.js';

const require = createRequire(import.meta.url);
let _Config = require('../../config/config.json');
// Class which handles list embed generation
export class ListUtils {
    // public static async getCustomMessageListEmbed(
    //     guild: Guild,
    //     customMessageResults: CustomMessages,
    //     page: number,
    //     pageSize: number,
    //     type: string,
    //     data: EventData
    // ): Promise<EmbedBuilder> {
    //     let embed: EmbedBuilder;
    //     let i = (page - 1) * pageSize + 1;
    //     let description = '';
    //     if (customMessageResults.customMessages.length === 0) {
    //         description += Lang.getRef('info', 'list.emptyList', data.lang);
    //     }
    //     let maxMessagesFree: number =
    //         type === 'member_anniversary'
    //             ? Config.validation.message.maxCount.memberAnniversary.free
    //             : type === 'server_anniversary'
    //             ? Config.validation.message.maxCount.serverAnniversary.free
    //             : Config.validation.message.maxCount.birthday.free;
    //     let maxMessagesPaid: number =
    //         type === 'member_anniversary'
    //             ? Config.validation.message.maxCount.memberAnniversary.paid
    //             : type === 'server_anniversary'
    //             ? Config.validation.message.maxCount.serverAnniversary.paid
    //             : Config.validation.message.maxCount.birthday.paid;
    //     for (let customMessage of customMessageResults.customMessages) {
    //         // dynamically check which ones to cross out due to the server not having premium anymore
    //         if (data.guildData?.premium.active || customMessage.Position <= maxMessagesFree) {
    //             description += `**${i.toLocaleString()}.** ${customMessage.Message}\n`;
    //         } else {
    //             description += `**${i.toLocaleString()}.** ~~${customMessage.Message}~~\n`;
    //         }
    //         // Added embedded part
    //         description += ` - **${Lang.getRef('info', 'terms.embedded', data.lang)}**: ${
    //             customMessage.Embed
    //                 ? Lang.getRef('info', 'boolean.true', data.lang)
    //                 : Lang.getRef('info', 'boolean.false', data.lang)
    //         }\n`;
    //         if (!data.guildData?.premium.active && customMessage.Color !== '0') description += '~~';
    //         // Added color part
    //         description += ` - **${Lang.getRef('info', 'terms.color', data.lang)}**: #${
    //             customMessage.Color === '0'
    //                 ? Config.colors.default.substring(1).toUpperCase()
    //                 : customMessage.Color
    //         }`;
    //         if (!data.guildData?.premium.active && customMessage.Color !== '0') description += '~~';
    //         description += '\n\n';
    //         i++;
    //     }
    //     let listEmbed = 'list.';
    //     if (
    //         !data.guildData?.premium.active &&
    //         customMessageResults.stats.TotalItems > maxMessagesFree
    //     ) {
    //         listEmbed +=
    //             type === 'member_anniversary'
    //                 ? 'memberAnniversaryMessageLocked'
    //                 : type === 'server_anniversary'
    //                 ? 'serverAnniversaryMessageLocked'
    //                 : 'birthdayMessageLocked';
    //         embed = Lang.getEmbed('info', listEmbed, data.lang, {
    //             PAGE: `${page > 0 ? page.toString() : '1'}`,
    //             LIST_DATA: description,
    //             TOTAL_PAGES: `${
    //                 customMessageResults.stats.TotalPages > 0
    //                     ? customMessageResults.stats.TotalPages.toString()
    //                     : '1'
    //             }`,
    //             TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
    //             PER_PAGE: Config.experience.messageListSize.toString(),
    //             MAX_FREE: maxMessagesFree.toString(),
    //             MAX_PAID: maxMessagesPaid.toString(),
    //             ICON: guild.client.user.displayAvatarURL(),
    //         });
    //     } else {
    //         listEmbed +=
    //             type === 'member_anniversary'
    //                 ? 'memberAnniversaryMessageUnLocked'
    //                 : type === 'server_anniversary'
    //                 ? 'serverAnniversaryMessageUnLocked'
    //                 : 'birthdayMessageUnLocked';
    //         embed = Lang.getEmbed('info', listEmbed, data.lang, {
    //             PAGE: `${page > 0 ? page.toString() : '1'}`,
    //             LIST_DATA: description,
    //             TOTAL_PAGES: `${
    //                 customMessageResults.stats.TotalPages > 0
    //                     ? customMessageResults.stats.TotalPages.toString()
    //                     : '1'
    //             }`,
    //             TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
    //             PER_PAGE: Config.experience.messageListSize.toString(),
    //             ICON: guild.client.user.displayAvatarURL(),
    //         });
    //     }
    //     return embed.setThumbnail(guild.iconURL());
    // }
    // public static async getCustomUserMessageListEmbed(
    //     guild: Guild,
    //     customMessageResults: CustomMessages,
    //     page: number,
    //     pageSize: number,
    //     type: string,
    //     data: EventData
    // ): Promise<EmbedBuilder> {
    //     let embed: EmbedBuilder;
    //     let description = '';
    //     if (customMessageResults.customMessages.length === 0) {
    //         description += Lang.getRef('info', 'list.emptyList', data.lang);
    //     }
    //     for (let customMessage of customMessageResults.customMessages) {
    //         let member = await ClientUtils.findMember(guild, customMessage.UserDiscordId);
    //         let regex = Lang.getRegex('info', 'placeHolders.usersRegex', data.lang);
    //         let messageDisplay = customMessage.Message.replaceAll(
    //             regex,
    //             member
    //                 ? member.toString()
    //                 : `**${Lang.getRef('info', 'terms.unknownMember', data.lang)}** `
    //         );
    //         if (data.guildData?.premium.active) {
    //             description += `**${customMessage.Position.toLocaleString()}.** ${messageDisplay}\n`;
    //         } else {
    //             description += `**${customMessage.Position.toLocaleString()}.** ~~${messageDisplay}~~\n`;
    //         }
    //         // Added embedded part
    //         description += ` - **${Lang.getRef('info', 'terms.embedded', data.lang)}**: ${
    //             customMessage.Embed
    //                 ? Lang.getRef('info', 'boolean.true', data.lang)
    //                 : Lang.getRef('info', 'boolean.false', data.lang)
    //         }\n`;
    //         if (!data.guildData?.premium.active && customMessage.Color !== '0') description += '~~';
    //         // Added color part
    //         description += ` - **${Lang.getRef('info', 'terms.color', data.lang)}**: #${
    //             customMessage.Color === '0'
    //                 ? Config.colors.default.substring(1).toUpperCase()
    //                 : customMessage.Color
    //         }`;
    //         if (!data.guildData?.premium.active && customMessage.Color !== '0') description += '~~';
    //         description += '\n\n';
    //     }
    //     let listEmbed = 'list.';
    //     if (!data.guildData?.premium.active) {
    //         listEmbed +=
    //             type === 'member_anniversary'
    //                 ? 'userSpecificMemberAnniversaryMessageLocked'
    //                 : 'userSpecificBirthdayMessageLocked';
    //         embed = Lang.getEmbed('info', listEmbed, data.lang, {
    //             PAGE: `${page > 0 ? page.toString() : '1'}`,
    //             LIST_DATA: description,
    //             TOTAL_PAGES: `${
    //                 customMessageResults.stats.TotalPages > 0
    //                     ? customMessageResults.stats.TotalPages.toString()
    //                     : '1'
    //             }`,
    //             TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
    //             PER_PAGE: Config.experience.messageListSize.toString(),
    //             ICON: guild.client.user.displayAvatarURL(),
    //         });
    //     } else {
    //         listEmbed +=
    //             type === 'member_anniversary'
    //                 ? 'userSpecificMemberAnniversaryMessageUnLocked'
    //                 : 'userSpecificBirthdayMessageUnLocked';
    //         embed = Lang.getEmbed('info', listEmbed, data.lang, {
    //             PAGE: `${page > 0 ? page.toString() : '1'}`,
    //             LIST_DATA: description,
    //             TOTAL_PAGES: `${
    //                 customMessageResults.stats.TotalPages > 0
    //                     ? customMessageResults.stats.TotalPages.toString()
    //                     : '1'
    //             }`,
    //             TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
    //             PER_PAGE: Config.experience.messageListSize.toString(),
    //             ICON: guild.client.user.displayAvatarURL(),
    //         });
    //     }
    //     return embed;
    // }
    // public static async getTrustedRoleListEmbed(
    //     guild: Guild,
    //     trustedRoleResults: TrustedRoles,
    //     page: number,
    //     pageSize: number,
    //     data: EventData
    // ): Promise<EmbedBuilder> {
    //     let embed: EmbedBuilder;
    //     let i = (page - 1) * pageSize + 1;
    //     let description = '';
    //     if (trustedRoleResults.trustedRoles.length === 0) {
    //         description += Lang.getRef('info', 'list.emptyList', data.lang);
    //     }
    //     for (let trustedRole of trustedRoleResults.trustedRoles) {
    //         // dynamically check which ones to cross out due to the server not having premium anymore
    //         let role = guild.roles.resolve(trustedRole.TrustedRoleDiscordId);
    //         let roleDisplay = role
    //             ? `${role.toString()}`
    //             : `**${Lang.getRef('info', 'terms.deletedRole', data.lang)}**`;
    //         if (
    //             data.guildData?.premium.active ||
    //             trustedRole.Position <= Config.validation.trustedRoles.maxCount.free
    //         ) {
    //             description += `**${i.toLocaleString()}.** ${roleDisplay}: (ID: ${
    //                 trustedRole.TrustedRoleDiscordId
    //             })\n\n`;
    //         } else {
    //             description += `**${i.toLocaleString()}.** ~~${roleDisplay}~~: (ID: ${
    //                 trustedRole.TrustedRoleDiscordId
    //             })\n\n`;
    //         }
    //         i++;
    //     }
    //     if (
    //         !data.guildData?.premium.active &&
    //         trustedRoleResults.stats.TotalItems > Config.validation.trustedRoles.maxCount.free
    //     ) {
    //         embed = Lang.getEmbed('info', 'list.trustedRolePaid', data.lang, {
    //             PAGE: `${page > 0 ? page.toString() : '1'}`,
    //             LIST_DATA: description,
    //             TOTAL_PAGES: `${
    //                 trustedRoleResults.stats.TotalPages > 0
    //                     ? trustedRoleResults.stats.TotalPages.toString()
    //                     : '1'
    //             }`,
    //             TOTAL_ROLES: trustedRoleResults.stats.TotalItems.toString(),
    //             PER_PAGE: Config.experience.trustedRoleListSize.toString(),
    //             MAX_FREE: Config.validation.trustedRoles.maxCount.free.toString(),
    //             MAX_PAID: Config.validation.trustedRoles.maxCount.paid.toString(),
    //             ICON: guild.client.user.displayAvatarURL(),
    //         });
    //     } else {
    //         embed = Lang.getEmbed('info', 'list.trustedRoleFree', data.lang, {
    //             PAGE: `${page > 0 ? page.toString() : '1'}`,
    //             LIST_DATA: description,
    //             TOTAL_PAGES: `${
    //                 trustedRoleResults.stats.TotalPages > 0
    //                     ? trustedRoleResults.stats.TotalPages.toString()
    //                     : '1'
    //             }`,
    //             TOTAL_ROLES: trustedRoleResults.stats.TotalItems.toString(),
    //             PER_PAGE: Config.experience.trustedRoleListSize.toString(),
    //             ICON: guild.client.user.displayAvatarURL(),
    //         });
    //     }
    //     return embed.setThumbnail(guild.iconURL());
    // }
    public static async getBirthdayListFullEmbed(
        guild: Guild,
        userDatas: UserData[],
        guildData: GuildData,
        page: number,
        pageSize: number,
        data: EventData
    ): Promise<EmbedBuilder> {
        let embed: EmbedBuilder;
        let description = '';
        if (userDatas.length === 0) {
            description += Lang.getRef('info', 'list.emptyList', data.lang);
        }

        // Calculate the starting and ending index of the list
        let startIndex = (page - 1) * pageSize;
        let endIndex = startIndex + pageSize;

        // Calculate stats
        let totalPages = Math.ceil(userDatas.length / pageSize);
        let totalBirthdays = userDatas.length;

        if (page > totalPages) page = totalPages;

        // Sort the list of users in order of birthdays
        userDatas.sort((a, b) => {
            let aDate = DateTime.fromFormat(a.birthday, 'LL-d');
            let bDate = DateTime.fromFormat(b.birthday, 'LL-d');
            if (aDate.month === bDate.month) {
                return aDate.day - bDate.day;
            } else {
                return aDate.month - bDate.month;
            }
        });

        // Remove the users that are not in the page range
        userDatas = userDatas.slice(startIndex, endIndex);

        let birthdays = [
            ...new Set(
                userDatas.map(d =>
                    DateTime.fromFormat(d.birthday, 'LL-d').toFormat('LLLL d', {
                        locale: data.lang,
                    })
                )
            ),
        ]; // remove duplicates
        // Go through the list of birthdays
        for (let birthday of birthdays) {
            let users = userDatas.filter(
                d =>
                    DateTime.fromFormat(d.birthday, 'LL-d').toFormat('LLLL d', {
                        locale: data.lang,
                    }) === birthday
            ); // Get all users with this birthday to create the sub list
            let members = guild.members.cache
                .filter(m => users.map(u => u.discordId).includes(m.id))
                .map(member => member);
            let userList = CelebrationUtils.getUserListString(guildData, members, data.lang); // Get the sub list of usernames for this date
            description += `__**${birthday}**__: ${userList}\n`; // Append the description
        }
        embed = Lang.getEmbed('info', 'list.birthday', data.lang, {
            PAGE: `${page > 0 ? page.toString() : '1'}`,
            LIST_DATA: description,
            TOTAL_PAGES: totalPages.toString(),
            TOTAL_BIRTHDAYS: totalBirthdays.toString(),
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
    ): Promise<EmbedBuilder> {
        let embed: EmbedBuilder;
        let description = '';
        if (guildMembers.length === 0) {
            description += Lang.getRef('info', 'list.emptyList', data.lang);
        }

        // filter out any members which have a joinedTimestamp of null
        guildMembers = guildMembers.filter(m => m.joinedTimestamp !== null);

        let anniversaries = [
            ...new Set(
                guildMembers.map(m =>
                    DateTime.fromJSDate(m.joinedAt).toFormat('LLLL d', { locale: data.lang })
                )
            ),
        ]; // remove duplicates

        // Go through the list of birthdays
        for (let anniversary of anniversaries) {
            let members = guildMembers.filter(
                m =>
                    DateTime.fromJSDate(m.joinedAt).toFormat('LLLL d', { locale: data.lang }) ===
                    anniversary
            ); // Get all users with this birthday to create the sub list
            let userList = CelebrationUtils.getUserListString(guildData, members, data.lang); // Get the sub list of usernames for this date
            description += `__**${anniversary}**__: ${userList}\n`; // Append the description
        }
        // Update config variables and add member anniversary list message
        embed = Lang.getEmbed('info', 'list.memberAnniversary', data.lang, {
            PAGE: `${page > 0 ? page.toString() : '1'}`,
            LIST_DATA: description,
            TOTAL_PAGES: `${totalPages > 0 ? totalPages.toString() : '1'}`,
            TOTAL_ANNIVERSARIES: totalMembers.toString(),
            PER_PAGE: pageSize.toString(),
            ICON: guild.client.user.displayAvatarURL(),
        });
        return embed.setThumbnail(guild.iconURL());
    }
    // public static async getBlacklistFullEmbed(
    //     guild: Guild,
    //     blacklistResults: Blacklisted,
    //     page: number,
    //     _pageSize: number,
    //     data: EventData
    // ): Promise<EmbedBuilder> {
    //     let embed: EmbedBuilder;
    //     let description = '';
    //     if (blacklistResults.blacklist.length === 0) {
    //         description += Lang.getRef('info', 'list.emptyList', data.lang);
    //     }
    //     let targets = blacklistResults.blacklist.map(data => data.DiscordId);
    //     for (let target of targets) {
    //         description += `**${
    //             guild.members.resolve(target)?.displayName ||
    //             guild.roles.resolve(target)?.toString() ||
    //             `**${Lang.getRef('info', 'terms.unknownTarget', data.lang)}**`
    //         }**: (ID: ${target})\n`; // Append the description
    //     }
    //     embed = Lang.getEmbed('info', 'list.blacklist', data.lang, {
    //         PAGE: `${page > 0 ? page.toString() : '1'}`,
    //         LIST_DATA: description,
    //         TOTAL_PAGES: `${
    //             blacklistResults.stats.TotalPages > 0
    //                 ? blacklistResults.stats.TotalPages.toString()
    //                 : '1'
    //         }`,
    //         TOTAL_BLACKLIST: blacklistResults.stats.TotalItems.toString(),
    //         PER_PAGE: Config.experience.blacklistSize.toString(),
    //         ICON: guild.client.user.displayAvatarURL(),
    //     });
    //     return embed.setThumbnail(guild.iconURL());
    // }
    // public static async getMemberAnniversaryRoleListEmbed(
    //     guild: Guild,
    //     memberAnniversaryRoleResults: MemberAnniversaryRoles,
    //     page: number,
    //     pageSize: number,
    //     data: EventData
    // ): Promise<EmbedBuilder> {
    //     let embed: EmbedBuilder;
    //     let description = '';
    //     if (memberAnniversaryRoleResults.memberAnniversaryRoles.length === 0) {
    //         description += Lang.getRef('info', 'list.emptyList', data.lang);
    //     }
    //     for (let memberAnniversaryRole of memberAnniversaryRoleResults.memberAnniversaryRoles) {
    //         // dynamically check which ones to cross out due to the server not having premium anymore
    //         let role = guild.roles.resolve(memberAnniversaryRole.MemberAnniversaryRoleDiscordId);
    //         let displayRole = role
    //             ? `${role.toString()}`
    //             : `**${Lang.getRef('info', 'terms.deletedRole', data.lang)}**`;
    //         if (
    //             data.guildData?.premium.active ||
    //             memberAnniversaryRole.Position <=
    //                 Config.validation.memberAnniversaryRoles.maxCount.free
    //         ) {
    //             description += `**Year ${memberAnniversaryRole.Year}:** ${displayRole}: (ID: ${memberAnniversaryRole.MemberAnniversaryRoleDiscordId})\n\n`;
    //         } else {
    //             description += `**Year ${memberAnniversaryRole.Year}:** ~~${displayRole}~~: (ID: ${memberAnniversaryRole.MemberAnniversaryRoleDiscordId})\n\n`;
    //         }
    //     }
    //     if (
    //         !data.guildData?.premium.active &&
    //         memberAnniversaryRoleResults.stats.TotalItems >
    //             Config.validation.memberAnniversaryRoles.maxCount.free
    //     ) {
    //         embed = Lang.getEmbed('info', 'list.memberAnniversaryRolePaid', data.lang, {
    //             PAGE: `${page > 0 ? page.toString() : '1'}`,
    //             LIST_DATA: description,
    //             TOTAL_PAGES: `${
    //                 memberAnniversaryRoleResults.stats.TotalPages > 0
    //                     ? memberAnniversaryRoleResults.stats.TotalPages.toString()
    //                     : '1'
    //             }`,
    //             TOTAL_ROLES: memberAnniversaryRoleResults.stats.TotalItems.toString(),
    //             PER_PAGE: Config.experience.memberAnniversaryRoleListSize.toString(),
    //             MAX_PAID: Config.validation.memberAnniversaryRoles.maxCount.paid.toString(),
    //             ICON: guild.client.user.displayAvatarURL(),
    //         });
    //     } else {
    //         embed = Lang.getEmbed('info', 'list.memberAnniversaryRoleFree', data.lang, {
    //             PAGE: `${page > 0 ? page.toString() : '1'}`,
    //             LIST_DATA: description,
    //             TOTAL_PAGES: `${
    //                 memberAnniversaryRoleResults.stats.TotalPages > 0
    //                     ? memberAnniversaryRoleResults.stats.TotalPages.toString()
    //                     : '1'
    //             }`,
    //             TOTAL_ROLES: memberAnniversaryRoleResults.stats.TotalItems.toString(),
    //             PER_PAGE: Config.experience.memberAnniversaryRoleListSize.toString(),
    //             ICON: guild.client.user.displayAvatarURL(),
    //         });
    //     }
    //     return embed.setThumbnail(guild.iconURL());
    // }
}
