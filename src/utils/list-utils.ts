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

        if (customMessageResults.customMessages.length === 0) {
            embed = new MessageEmbed()
                .setColor(Config.colors.default)
                .setDescription(
                    Lang.getRef(
                        'info',
                        type === 'birthday'
                            ? 'list.noCustomBirthdayMessages'
                            : type === 'memberanniversary'
                            ? 'list.noCustomMemberAnniversaryMessages'
                            : 'list.noCustomServerAnniversaryMessages',
                        data.lang()
                    )
                );
            return embed;
        }
        let description = '';

        let maxMessagesFree: number =
            type === 'memberanniversary'
                ? Config.validation.message.maxCount.memberAnniversary.free
                : type === 'serveranniversary'
                ? Config.validation.message.maxCount.serverAnniversary.free
                : Config.validation.message.maxCount.birthday.free;
        let maxMessagesPaid: number =
            type === 'memberanniversary'
                ? Config.validation.message.maxCount.memberAnniversary.paid
                : type === 'serveranniversary'
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
                type === 'memberanniversary'
                    ? 'memberAnniversaryMessageLocked'
                    : type === 'serveranniversary'
                    ? 'serverAnniversaryMessageLocked'
                    : 'birthdayMessageLocked';
            embed = Lang.getEmbed('info', listEmbed, data.lang(), {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: customMessageResults.stats.TotalPages.toString(),
                TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.birthdayMessageListSize.toString(),
                MAX_FREE: maxMessagesFree.toString(),
                MAX_PAID: maxMessagesPaid.toString(),
                ICON: guild.client.user.displayAvatarURL(),
            });
        } else {
            listEmbed +=
                type === 'memberanniversary'
                    ? 'memberAnniversaryMessageUnLocked'
                    : type === 'serveranniversary'
                    ? 'serverAnniversaryMessageUnLocked'
                    : 'birthdayMessageUnLocked';
            embed = Lang.getEmbed('info', listEmbed, data.lang(), {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: customMessageResults.stats.TotalPages.toString(),
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

        if (customMessageResults.customMessages.length === 0) {
            embed = new MessageEmbed()
                .setDescription(
                    Lang.getRef(
                        'info',
                        type === 'birthday'
                            ? 'list.noCustomUserSpecificBirthdayMessages'
                            : 'list.noCustomUserSpecificMemberAnnivesaryMessages',
                        data.lang()
                    )
                )
                .setColor(Config.colors.default);
            return embed;
        }
        let description = '';

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
                type === 'memberanniversary'
                    ? 'userSpecificMemberAnniversaryMessageLocked'
                    : 'userSpecificBirthdayMessageLocked';
            embed = Lang.getEmbed('info', listEmbed, data.lang(), {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: customMessageResults.stats.TotalPages.toString(),
                TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.birthdayMessageListSize.toString(),
                ICON: guild.client.user.displayAvatarURL(),
            });
        } else {
            listEmbed +=
                type === 'memberanniversary'
                    ? 'userSpecificMemberAnniversaryMessageUnLocked'
                    : 'userSpecificBirthdayMessageUnLocked';
            embed = Lang.getEmbed('info', listEmbed, data.lang(), {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: customMessageResults.stats.TotalPages.toString(),
                TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.birthdayMessageListSize.toString(),
                ICON: guild.client.user.displayAvatarURL(),
            });
        }

        return embed;
    }

    public static async getTrustedRoleList(
        guild: Guild,
        trustedRoleResults: TrustedRoles,
        page: number,
        pageSize: number,
        hasPremium: boolean,
        data: EventData
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;

        let i = (page - 1) * pageSize + 1;

        if (trustedRoleResults.trustedRoles.length === 0) {
            let embed = new MessageEmbed()
                .setDescription(Lang.getRef('info', 'list.noTrustedRoles', data.lang()))
                .setColor(Config.colors.default);
            return embed;
        }
        let description = '';

        for (let trustedRole of trustedRoleResults.trustedRoles) {
            // dynamically check which ones to cross out due to the server not having premium anymore
            let role = guild.roles.resolve(trustedRole.TrustedRoleDiscordId);
            if (
                hasPremium ||
                trustedRole.Position <= Config.validation.trustedRoles.maxCount.free
            ) {
                description += `**${i.toLocaleString()}.** ${
                    role ? `${role.toString()} ` : '**** '
                }\n\n`;
            } else {
                description += `**${i.toLocaleString()}.** ${
                    role
                        ? `~~${role.toString()}~~ `
                        : `**${Lang.getRef('info', 'terms.deletedRole', data.lang())}** `
                }\n\n`;
            }
            i++;
        }

        if (
            !hasPremium &&
            trustedRoleResults.stats.TotalItems > Config.validation.trustedRoles.maxCount.free
        ) {
            embed = Lang.getEmbed('info', 'list.trustedRolePaid', data.lang(), {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: trustedRoleResults.stats.TotalPages.toString(),
                TOTAL_ROLES: trustedRoleResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.trustedRoleListSize.toString(),
                MAX_FREE: Config.validation.trustedRoles.maxCount.free.toString(),
                MAX_PAID: Config.validation.trustedRoles.maxCount.paid.toString(),
                ICON: guild.client.user.displayAvatarURL(),
            });
        } else {
            embed = Lang.getEmbed('info', 'list.trustedRoleFree', data.lang(), {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: trustedRoleResults.stats.TotalPages.toString(),
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
        if (userDataResults.userData.length === 0) {
            let embed = new MessageEmbed()
                .setDescription(Lang.getRef('info', 'list.noBirthdays', data.lang()))
                .setColor(Config.colors.default);
            return embed;
        }
        let description = '';
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
            PAGE: page.toString(),
            LIST_DATA: description,
            TOTAL_PAGES: userDataResults.stats.TotalPages.toString(),
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
        if (guildMembers.length === 0) {
            // Not implemented
            let embed = new MessageEmbed()
                .setDescription(Lang.getRef('info', 'list.noMemberAnniversaries', data.lang()))
                .setColor(Config.colors.default);
            return embed;
        }
        let description = '';
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
            PAGE: page.toString(),
            LIST_DATA: description,
            TOTAL_PAGES: totalPages.toString(),
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

        if (blacklistResults.blacklist.length === 0) {
            let embed = new MessageEmbed()
                .setDescription(Lang.getRef('info', 'list.emptyBlacklist', data.lang()))
                .setColor(Config.colors.default);
            return embed;
        }
        let description = '';
        let targets = blacklistResults.blacklist.map(data => data.DiscordId);

        for (let target of targets) {
            description += `**${
                guild.members.resolve(target)?.displayName ||
                guild.roles.resolve(target)?.toString() ||
                `**${Lang.getRef('info', 'terms.unknownTarget', data.lang())}**`
            }**: (ID: ${target})\n`; // Append the description
        }

        embed = Lang.getEmbed('info', 'list.blacklist', data.lang(), {
            PAGE: page.toString(),
            LIST_DATA: description,
            TOTAL_PAGES: blacklistResults.stats.TotalPages.toString(),
            TOTAL_BLACKLIST: blacklistResults.stats.TotalItems.toString(),
            PER_PAGE: Config.experience.blacklistSize.toString(),
            ICON: guild.client.user.displayAvatarURL(),
        });

        return embed.setThumbnail(guild.iconURL());
    }

    public static async getMemberAnniversaryRoleList(
        guild: Guild,
        memberAnniversaryRoleResults: MemberAnniversaryRoles,
        page: number,
        pageSize: number,
        hasPremium: boolean,
        data: EventData
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;

        if (memberAnniversaryRoleResults.memberAnniversaryRoles.length === 0) {
            let embed = new MessageEmbed()
                .setDescription(Lang.getRef('info', 'list.noMemberAnniversaryRoles', data.lang()))
                .setColor(Config.colors.default);
            return embed;
        }
        let description = '';

        for (let memberAnniversaryRole of memberAnniversaryRoleResults.memberAnniversaryRoles) {
            // dynamically check which ones to cross out due to the server not having premium anymore
            let role = guild.roles.resolve(memberAnniversaryRole.MemberAnniversaryRoleDiscordId);
            if (
                hasPremium ||
                memberAnniversaryRole.Position <=
                    Config.validation.memberAnniversaryRoles.maxCount.free
            ) {
                description += `**Year ${memberAnniversaryRole.Year}:** ${
                    role ? `${role.toString()} ` : '**** '
                }\n\n`;
            } else {
                description += `**Year ${memberAnniversaryRole.Year}:** ${
                    role
                        ? `~~${role.toString()}~~ `
                        : `**${Lang.getRef('info', 'terms.deletedRole', data.lang())}** `
                }\n\n`;
            }
        }

        if (
            !hasPremium &&
            memberAnniversaryRoleResults.stats.TotalItems >
                Config.validation.memberAnniversaryRoles.maxCount.free
        ) {
            embed = Lang.getEmbed('info', 'list.memberAnniversaryRolePaid', data.lang(), {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: memberAnniversaryRoleResults.stats.TotalPages.toString(),
                TOTAL_ROLES: memberAnniversaryRoleResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.memberAnniversaryRoleListSize.toString(),
                MAX_PAID: Config.validation.memberAnniversaryRoles.maxCount.paid.toString(),
                ICON: guild.client.user.displayAvatarURL(),
            });
        } else {
            embed = Lang.getEmbed('info', 'list.memberAnniversaryRoleFree', data.lang(), {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: memberAnniversaryRoleResults.stats.TotalPages.toString(),
                TOTAL_ROLES: memberAnniversaryRoleResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.memberAnniversaryRoleListSize.toString(),
                ICON: guild.client.user.displayAvatarURL(),
            });
        }

        return embed.setThumbnail(guild.iconURL());
    }
}
