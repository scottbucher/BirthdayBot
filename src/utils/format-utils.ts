import * as Chrono from 'chrono-node';

import { Blacklisted, CustomMessages, GuildData, UserDataResults } from '../models/database';
import { Guild, GuildMember, Message, MessageEmbed, Role, User } from 'discord.js';
import { GuildUtils, ParseUtils } from '.';

import { CelebrationUtils } from './celebration-utils';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { MemberAnniversaryRoles } from '../models/database/member-anniversary-role-models';
import { TrustedRoles } from '../models/database/trusted-role-models';
import moment from 'moment-timezone';

let Config = require('../../config/config.json');
let Abbreviations = require('../../config/abbreviations.json');
const PAGE_REGEX = /Page (\d+)\/(\d+)/;
let zoneNames = moment.tz
    .names()
    .filter(name => Config.validation.regions.some((region: any) => name.startsWith(`${region}/`)));

export class FormatUtils {
    // TODO: fix so there isn't a comma where there are only two users
    public static joinWithAnd(values: string[]): string {
        return values.length == 2
            ? values[0] + ' ' + values[1]
            : [values.slice(0, -1).join(', '), values.slice(-1)[0]].join(
                values.length < 2 ? '' : `, ${Lang.getRef('terms.and', LangCode.EN_US)} `
            );
    }

    public static checkAbbreviation(input: string): boolean {
        return Abbreviations.abbreviations.includes(input.toUpperCase());
    }

    public static findZone(input: string): string {
        let zoneSearch = input.split(/\s+/).join('_').toLowerCase();
        return zoneNames.find(zone => zone.toLowerCase().includes(zoneSearch));
    }

    // TODO: take another look at this
    public static getBirthday(input: string): string {
        // Try and get a date from the 3rd args
        if (
            input.includes('02/29') ||
            input.includes('2/29') ||
            input
                .toLowerCase()
                .includes(Lang.getRef('months.feb', LangCode.EN_US).toLowerCase() + ' 29') ||
            input
                .toLowerCase()
                .includes(
                    Lang.getRef('months.feb', LangCode.EN_US).toLowerCase().slice(0, 2) + ' 29'
                ) ||
            input
                .toLowerCase()
                .includes(Lang.getRef('months.feb', LangCode.EN_US).toLowerCase() + ' 29th') ||
            input
                .toLowerCase()
                .includes(
                    Lang.getRef('months.feb', LangCode.EN_US).toLowerCase().slice(0, 2) + ' 29th'
                )
        )
            input = '2000-02-29';
        let results = Chrono.parseDate(input); // Try an parse a date

        if (!results) return null;

        let month = results.getMonth() + 1; // Get the numeric value of month
        let day = results.getDate();
        let temp = `2000-${month}-${day}`;
        let doubleCheck = Chrono.parseDate(temp);

        return doubleCheck ? temp : null;
    }

    public static getUser(msg: Message, input: string): User {
        return (
            msg.mentions.members.first()?.user ||
            GuildUtils.findMember(msg.guild, input)?.user ||
            null
        );
    }

    public static getMonth(month: number): string {
        switch (month) {
            case 1:
                return Lang.getRef('months.jan', LangCode.EN_US);
            case 2:
                return Lang.getRef('months.feb', LangCode.EN_US);
            case 3:
                return Lang.getRef('months.mar', LangCode.EN_US);
            case 4:
                return Lang.getRef('months.apr', LangCode.EN_US);
            case 5:
                return Lang.getRef('months.may', LangCode.EN_US);
            case 6:
                return Lang.getRef('months.jun', LangCode.EN_US);
            case 7:
                return Lang.getRef('months.jul', LangCode.EN_US);
            case 8:
                return Lang.getRef('months.aug', LangCode.EN_US);
            case 9:
                return Lang.getRef('months.sep', LangCode.EN_US);
            case 10:
                return Lang.getRef('months.oct', LangCode.EN_US);
            case 11:
                return Lang.getRef('months.nov', LangCode.EN_US);
            case 12:
                return Lang.getRef('months.dec', LangCode.EN_US);
            default:
                return Lang.getRef('months.invalid', LangCode.EN_US);
        }
    }

    // TODO: add usage of arrays in lang system
    public static findBoolean(input: string): boolean {
        switch (input.toLowerCase()) {
            case 'enabled':
            case 'enable':
            case 'e':
            case 'yes':
            case 'y':
            case 'true':
            case 't':
            case 'on':
            case '1':
                return true;
            case 'disabled':
            case 'disable':
            case 'd':
            case 'no':
            case 'n':
            case 'false':
            case 'f':
            case 'off':
            case '0':
                return false;
            default:
                return null;
        }
    }

    public static async getCustomMessageListEmbed(
        guild: Guild,
        customMessageResults: CustomMessages,
        page: number,
        pageSize: number,
        hasPremium: boolean,
        type: string
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;

        let i = (page - 1) * pageSize + 1;

        if (customMessageResults.customMessages.length === 0) {
            embed = new MessageEmbed()
                .setColor(Config.colors.default)
                .setDescription(
                    Lang.getRef(
                        type === 'birthday'
                            ? 'list.noCustomBirthdayMessages'
                            : type === 'memberanniversary'
                                ? 'list.noCustomMemberAnniversaryMessages'
                                : 'list.noCustomServerAnniversaryMessages',
                        LangCode.EN_US
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
                description += `**${i.toLocaleString()}.** ${customMessage.Message}\n\n`;
            } else {
                description += `**${i.toLocaleString()}.** ~~${customMessage.Message}~~\n\n`;
            }
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
            embed = Lang.getEmbed(listEmbed, LangCode.EN_US, {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: customMessageResults.stats.TotalPages.toString(),
                TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.birthdayMessageListSize.toString(),
                MAX_FREE: maxMessagesFree.toString(),
                MAX_PAID: maxMessagesPaid.toString(),
            });
        } else {
            listEmbed +=
                type === 'memberanniversary'
                    ? 'memberAnniversaryMessageUnLocked'
                    : type === 'serveranniversary'
                        ? 'serverAnniversaryMessageUnLocked'
                        : 'birthdayMessageUnLocked';
            embed = Lang.getEmbed(listEmbed, LangCode.EN_US, {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: customMessageResults.stats.TotalPages.toString(),
                TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.birthdayMessageListSize.toString(),
            });
        }

        return embed.setThumbnail(guild.iconURL());
    }

    public static async getCustomUserMessageListEmbed(
        guild: Guild,
        customMessageResults: CustomMessages,
        page: number,
        pageSize: number,
        hasPremium: boolean,
        type: string
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;

        if (customMessageResults.customMessages.length === 0) {
            embed = new MessageEmbed()
                .setDescription(
                    Lang.getRef(
                        type === 'birthday'
                            ? 'list.noCustomUserSpecificBirthdayMessages'
                            : 'list.noCustomUserSpecificMemberAnnivesaryMessages',
                        LangCode.EN_US
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
                        : `**${Lang.getRef('terms.unknownMember', LangCode.EN_US)}** `
                    } ${customMessage.Message.replace('<Users>', member.toString())}\n\n`;
            } else {
                description += `${
                    member
                        ? `**${member.displayName}**: `
                        : `**${Lang.getRef('terms.unknownMember', LangCode.EN_US)}** `
                    } ~~${customMessage.Message.replace('<Users>', member.toString())}~~\n\n`;
            }
        }

        let listEmbed = 'list.';

        if (!hasPremium) {
            listEmbed +=
                type === 'memberanniversary'
                    ? 'userSpecificMemberAnniversaryMessageLocked'
                    : 'userSpecificBirthdayMessageLocked';
            embed = Lang.getEmbed(listEmbed, LangCode.EN_US, {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: customMessageResults.stats.TotalPages.toString(),
                TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.birthdayMessageListSize.toString(),
            });
        } else {
            listEmbed +=
                type === 'memberanniversary'
                    ? 'userSpecificMemberAnniversaryMessageUnLocked'
                    : 'userSpecificBirthdayMessageUnLocked';
            embed = Lang.getEmbed(listEmbed, LangCode.EN_US, {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: customMessageResults.stats.TotalPages.toString(),
                TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.birthdayMessageListSize.toString(),
            });
        }

        return embed;
    }

    public static async getTrustedRoleList(
        guild: Guild,
        trustedRoleResults: TrustedRoles,
        page: number,
        pageSize: number,
        hasPremium: boolean
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;

        let i = (page - 1) * pageSize + 1;

        if (trustedRoleResults.trustedRoles.length === 0) {
            let embed = new MessageEmbed()
                .setDescription(Lang.getRef('list.noTrustedRoles', LangCode.EN_US))
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
                    role ? `${role.toString()} ` : `**** `
                    }\n\n`;
            } else {
                description += `**${i.toLocaleString()}.** ${
                    role
                        ? `~~${role.toString()}~~ `
                        : `**${Lang.getRef('terms.deletedRole', LangCode.EN_US)}** `
                    }\n\n`;
            }
            i++;
        }

        if (
            !hasPremium &&
            trustedRoleResults.stats.TotalItems > Config.validation.trustedRoles.maxCount.free
        ) {
            embed = Lang.getEmbed('list.trustedRolePaid', LangCode.EN_US, {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: trustedRoleResults.stats.TotalPages.toString(),
                TOTAL_ROLES: trustedRoleResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.trustedRoleListSize.toString(),
                MAX_FREE: Config.validation.trustedRoles.maxCount.free.toString(),
                MAX_PAID: Config.validation.trustedRoles.maxCount.paid.toString(),
            });
        } else {
            embed = Lang.getEmbed('list.trustedRoleFree', LangCode.EN_US, {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: trustedRoleResults.stats.TotalPages.toString(),
                TOTAL_ROLES: trustedRoleResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.trustedRoleListSize.toString(),
            });
        }

        return embed.setThumbnail(guild.iconURL());
    }

    public static async getBirthdayListFullEmbed(
        guild: Guild,
        userDataResults: UserDataResults,
        guildData: GuildData,
        page: number,
        pageSize: number
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;
        if (userDataResults.userData.length === 0) {
            let embed = new MessageEmbed()
                .setDescription(Lang.getRef('list.noBirthdays', LangCode.EN_US))
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

        embed = Lang.getEmbed('list.birthday', LangCode.EN_US, {
            PAGE: page.toString(),
            LIST_DATA: description,
            TOTAL_PAGES: userDataResults.stats.TotalPages.toString(),
            TOTAL_BIRTHDAYS: userDataResults.stats.TotalItems.toString(),
            PER_PAGE: pageSize.toString(),
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
        totalMembers: number
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;
        if (guildMembers.length === 0) {
            // Not implemented
            let embed = new MessageEmbed()
                .setDescription(Lang.getRef('list.noMemberAnniversaries', LangCode.EN_US))
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
        embed = Lang.getEmbed('list.memberAnniversary', LangCode.EN_US, {
            PAGE: page.toString(),
            LIST_DATA: description,
            TOTAL_PAGES: totalPages.toString(),
            TOTAL_ANNIVERSARIES: totalMembers.toString(),
            PER_PAGE: pageSize.toString(),
        });

        return embed.setThumbnail(guild.iconURL());
    }

    public static async getBlacklistFullEmbed(
        guild: Guild,
        blacklistResults: Blacklisted,
        page: number,
        pageSize: number
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;

        if (blacklistResults.blacklist.length === 0) {
            let embed = new MessageEmbed()
                .setDescription(Lang.getRef('list.emptyBlacklist', LangCode.EN_US))
                .setColor(Config.colors.default);
            return embed;
        }
        let description = '';
        let users = blacklistResults.blacklist.map(data => data.UserDiscordId);

        for (let user of users) {
            description += `**${
                guild.members.resolve(user)?.displayName ||
                `**${Lang.getRef('terms.unknownMember', LangCode.EN_US)}**`
                }**: (ID: ${user})\n`; // Append the description
        }

        embed = Lang.getEmbed('list.blacklist', LangCode.EN_US, {
            PAGE: page.toString(),
            LIST_DATA: description,
            TOTAL_PAGES: blacklistResults.stats.TotalPages.toString(),
            TOTAL_BLACKLIST: blacklistResults.stats.TotalItems.toString(),
            PER_PAGE: Config.experience.blacklistSize.toString(),
        });

        return embed.setThumbnail(guild.iconURL());
    }

    public static async getMemberAnniversaryRoleList(
        guild: Guild,
        memberAnniversaryRoleResults: MemberAnniversaryRoles,
        page: number,
        pageSize: number,
        hasPremium: boolean
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;

        if (memberAnniversaryRoleResults.memberAnniversaryRoles.length === 0) {
            let embed = new MessageEmbed()
                .setDescription(Lang.getRef('list.noMemberAnniversaryRoles', LangCode.EN_US))
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
                    role ? `${role.toString()} ` : `**** `
                    }\n\n`;
            } else {
                description += `**Year ${memberAnniversaryRole.Year}:** ${
                    role
                        ? `~~${role.toString()}~~ `
                        : `**${Lang.getRef('terms.deletedRole', LangCode.EN_US)}** `
                    }\n\n`;
            }
        }

        if (
            !hasPremium &&
            memberAnniversaryRoleResults.stats.TotalItems >
            Config.validation.memberAnniversaryRoles.maxCount.free
        ) {
            embed = Lang.getEmbed('list.memberAnniversaryRolePaid', LangCode.EN_US, {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: memberAnniversaryRoleResults.stats.TotalPages.toString(),
                TOTAL_MESSAGES: memberAnniversaryRoleResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.memberAnniversaryRoleListSize.toString(),
                MAX_PAID: Config.validation.memberAnniversaryRoles.maxCount.paid.toString(),
            });
        } else {
            embed = Lang.getEmbed('list.memberAnniversaryRoleFree', LangCode.EN_US, {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: memberAnniversaryRoleResults.stats.TotalPages.toString(),
                TOTAL_MESSAGES: memberAnniversaryRoleResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.memberAnniversaryRoleListSize.toString(),
            });
        }

        return embed.setThumbnail(guild.iconURL());
    }

    public static extractPageNumber(input: string): number {
        let match = PAGE_REGEX.exec(input);
        return match ? ParseUtils.parseInt(match[1]) : null;
    }

    // THIS IS WRONG
    // ALTERNATIVES ARE SUPPOSED TO BE ARRAYS BUT LANG SYSTEM DOESN'T SUPPORT IT
    public static extractCelebrationType(type: string): string {
        switch (type) {
            case Lang.getRef('types.birthday', LangCode.EN_US).toLowerCase() ||
                Lang.getRef('types.alternatives.birthday', LangCode.EN_US).toLowerCase():
                return 'birthday';
            case Lang.getRef('types.memberAnniversary', LangCode.EN_US).toLowerCase() ||
                Lang.getRef('types.alternatives.memberAnniversary', LangCode.EN_US).toLowerCase():
                return 'memberanniversary';

            case Lang.getRef('types.serverAnniversary', LangCode.EN_US).toLowerCase() ||
                Lang.getRef('types.alternatives.serverAnniversary', LangCode.EN_US).toLowerCase():
                return 'serveranniversary';

            case Lang.getRef('types.userSpecificBirthday', LangCode.EN_US).toLowerCase() ||
                Lang.getRef(
                    'types.alternatives.userSpecificBirthday',
                    LangCode.EN_US
                ).toLowerCase():
                return 'userspecificbirthday';

            case Lang.getRef('types.userSpecificMemberAnniversary', LangCode.EN_US).toLowerCase() ||
                Lang.getRef(
                    'types.alternatives.userSpecificMemberAnniversary',
                    LangCode.EN_US
                ).toLowerCase():
                return 'userspecificmemberanniversary';
            default:
                return null;
        }
    }
    public static extractConfigType(type: string): string {
        switch (type) {
            case Lang.getRef('types.channel', LangCode.EN_US).toLowerCase():
                return 'channel';
            case Lang.getRef('types.birthdayRole', LangCode.EN_US).toLowerCase():
                return 'role';
            case Lang.getRef('types.birthdayMasterRole', LangCode.EN_US).toLowerCase():
                return 'birthdayMasterRole';
            case Lang.getRef('types.nameFormat', LangCode.EN_US).toLowerCase():
                return 'nameFormat';
            case Lang.getRef('types.timezone', LangCode.EN_US).toLowerCase():
                return 'timezone';
            case Lang.getRef('types.useTimezone', LangCode.EN_US).toLowerCase():
                return 'useTimezone';
            case Lang.getRef('types.trustedPreventsRole', LangCode.EN_US).toLowerCase():
                return 'trustedPreventsRole';
            case Lang.getRef('types.trustedPreventsMessage', LangCode.EN_US).toLowerCase():
                return 'trustedPreventsMessage';
            case Lang.getRef('types.requireAllTrustedRoles', LangCode.EN_US).toLowerCase():
                return 'requireAllTrustedRoles';
            default:
                return null;
        }
    }

    public static extractNameFormatType(type: string): string {
        switch (type) {
            case Lang.getRef('types.mention', LangCode.EN_US).toLowerCase():
                return 'mention';
            case Lang.getRef('types.nickname', LangCode.EN_US).toLowerCase():
                return 'nickname';
            case Lang.getRef('types.username', LangCode.EN_US).toLowerCase():
                return 'username';
            case Lang.getRef('types.tag', LangCode.EN_US).toLowerCase():
                return 'tag';
            case Lang.getRef('types.default', LangCode.EN_US).toLowerCase():
                return 'default';
            default:
                return null;
        }
    }

    public static extractMiscActionType(type: string): string {
        switch (type) {
            case Lang.getRef('types.add', LangCode.EN_US).toLowerCase():
                return 'add';
            case Lang.getRef('types.remove', LangCode.EN_US).toLowerCase():
                return 'remove';
            case Lang.getRef('types.clear', LangCode.EN_US).toLowerCase():
                return 'clear';
            case Lang.getRef('types.list', LangCode.EN_US).toLowerCase():
                return 'list';
            case Lang.getRef('types.mention', LangCode.EN_US).toLowerCase():
                return 'mention';
            case Lang.getRef('types.time', LangCode.EN_US).toLowerCase():
                return 'time';
            case Lang.getRef('types.useEmbed', LangCode.EN_US).toLowerCase():
                return 'useEmbed';
            case Lang.getRef('types.help', LangCode.EN_US).toLowerCase():
                return 'help';
            case Lang.getRef('types.setup', LangCode.EN_US).toLowerCase():
                return 'setup';
            case Lang.getRef('types.anniversary', LangCode.EN_US).toLowerCase():
                return 'anniversary';
            case Lang.getRef('types.message', LangCode.EN_US).toLowerCase():
                return 'message';
            case Lang.getRef('types.blacklist', LangCode.EN_US).toLowerCase():
                return 'blacklist';
            case Lang.getRef('types.advanced', LangCode.EN_US).toLowerCase():
                return 'advanced';
            case Lang.getRef('types.premium', LangCode.EN_US).toLowerCase():
                return 'premium';
            case Lang.getRef('types.test', LangCode.EN_US).toLowerCase():
                return 'test';
            case Lang.getRef('types.create', LangCode.EN_US).toLowerCase():
                return 'create';
            case Lang.getRef('types.user', LangCode.EN_US).toLowerCase():
                return 'user';
            case Lang.getRef('types.server', LangCode.EN_US).toLowerCase():
                return 'server';
            case Lang.getRef('types.trusted', LangCode.EN_US).toLowerCase():
                return 'trusted';
            case Lang.getRef('types.claim', LangCode.EN_US).toLowerCase():
                return 'claim';
            default:
                return null;
        }
    }

    public static getCelebrationDisplayType(type: string, plural: boolean): string {
        switch (type) {
            case 'birthday':
                return Lang.getRef('terms.birthdayMessage' + (plural ? 's' : ''), LangCode.EN_US);
            case 'memberanniversary':
                return Lang.getRef(
                    'terms.memberAnniversaryMessage' + (plural ? 's' : ''),
                    LangCode.EN_US
                );
            case 'serveranniversary':
                return Lang.getRef(
                    'terms.serverAnniversaryMessage' + (plural ? 's' : ''),
                    LangCode.EN_US
                );
            case 'userspecificbirthday':
                return Lang.getRef(
                    'terms.userBirthdayMessage' + (plural ? 's' : ''),
                    LangCode.EN_US
                );
            case 'userspecificmemberanniversary':
                return Lang.getRef(
                    'terms.userMemberAnniversaryMessage' + (plural ? 's' : ''),
                    LangCode.EN_US
                );
            default:
                return null;
        }
    }

    public static getMentionSetting(mentionSetting: string, guild: Guild): string {
        // Find mentioned role
        let roleInput: Role = guild.roles.resolve(mentionSetting);

        if (!roleInput || roleInput.guild.id !== guild.id) {
            if (
                mentionSetting.toLowerCase() === 'everyone' ||
                mentionSetting.toLowerCase() === 'here'
            ) {
                return '@' + mentionSetting;
            }
        } else {
            return roleInput.toString();
        }
        return 'none';
    }

    public static getMessageTime(time: number): string {
        let am = Lang.getRef('terms.amTime', LangCode.EN_US);
        let pm = Lang.getRef('terms.pmTime', LangCode.EN_US);
        if (time === 0) return '12:00 ' + am;
        else if (time === 12) return '12:00 ' + pm;
        else if (time < 12) return time + ':00 ' + am;
        else return time - 12 + ':00 ' + pm;
    }
}
