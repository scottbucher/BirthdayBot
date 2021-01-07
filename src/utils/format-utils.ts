import * as Chrono from 'chrono-node';

import { Blacklisted, CustomMessages, UserDataResults } from '../models/database';
import { Guild, Message, MessageEmbed, User, Util } from 'discord.js';

import { GuildUtils } from '.';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { TrustedRoles } from '../models/database/trusted-role-models';
import moment from 'moment-timezone';

let Config = require('../../config/config.json');
let Abbreviations = require('../../config/abbreviations.json');
const PAGE_REGEX = /Page (\d+)\/(\d+)/;
let zoneNames = moment.tz
    .names()
    .filter(name => Config.validation.regions.some((region: any) => name.startsWith(`${region}/`)));

export class FormatUtils {
    public static getRoleName(guild: Guild, roleDiscordId: string): string {
        return roleDiscordId
            ? guild.roles.resolve(roleDiscordId)?.toString() || '**Unknown**'
            : '**None**';
    }

    public static getMemberDisplayName(memberDiscordId: string, guild: Guild): string {
        let displayName = guild.members.resolve(memberDiscordId)?.displayName;
        return displayName ? Util.escapeMarkdown(displayName) : 'Unknown Member';
    }

    public static getMemberMention(memberDiscordId: string, guild: Guild): string {
        return guild.members.resolve(memberDiscordId)?.toString() || 'Unknown Member';
    }

    public static getPercent(decimal: number): string {
        return Math.floor(decimal * 100) + '%';
    }

    public static isHour(input: number): boolean {
        return Number.isInteger(input) && input >= 0 && input <= 23;
    }

    public static joinWithAnd(values: string[]): string {
        return [values.slice(0, -1).join(', '), values.slice(-1)[0]].join(
            values.length < 2 ? '' : ', and '
        );
    }

    public static checkAbbreviation(input: string): boolean {
        return Abbreviations.abbreviations.includes(input.toUpperCase());
    }

    public static findZone(input: string): string {
        let zoneSearch = input.split(/\s+/).join('_').toLowerCase();
        return zoneNames.find(zone => zone.toLowerCase().includes(zoneSearch));
    }

    public static getBirthday(input: string): string {
        // Try and get a date from the 3rd args
        if (
            input === '02/29' ||
            input === '2/29' ||
            input.toLowerCase() === 'february 29' ||
            input.toLowerCase() === 'feb 29' ||
            input.toLowerCase() === 'february 29th' ||
            input.toLowerCase() === 'feb 29th'
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
                return 'January';
            case 2:
                return 'February';
            case 3:
                return 'March';
            case 4:
                return 'April';
            case 5:
                return 'May';
            case 6:
                return 'June';
            case 7:
                return 'July';
            case 8:
                return 'August';
            case 9:
                return 'September';
            case 10:
                return 'October';
            case 11:
                return 'November';
            case 12:
                return 'December';
            default:
                return 'Invalid month';
        }
    }

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
                    type === 'birthday'
                        ? Lang.getRef('list.noCustomBirthdayMessages', LangCode.EN)
                        : type === 'memberanniversary'
                        ? Lang.getRef('list.noCustomMemberAnniversaryMessages', LangCode.EN)
                        : Lang.getRef('list.noCustomServerAnniversaryMessages', LangCode.EN)
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

        let langType =
            type === 'memberanniversary'
                ? 'memberAnniversary'
                : type === 'serveranniversary'
                ? 'serverAnniversary'
                : type;

        let listEmbed = 'list.';

        if (!hasPremium && customMessageResults.stats.TotalItems > maxMessagesFree) {
            listEmbed +=
                type === 'memberanniversary'
                    ? 'memberAnniversaryMessagePaid'
                    : type === 'serveranniversary'
                    ? 'serverAnniversaryMessagePaid'
                    : 'birthdayMessagePaid';
            embed = Lang.getEmbed(listEmbed, LangCode.EN, {
                TYPE: langType,
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
                    ? 'memberAnniversaryMessageFree'
                    : type === 'serveranniversary'
                    ? 'serverAnniversaryMessageFree'
                    : 'birthdayMessageFree';
            embed = Lang.getEmbed(listEmbed, LangCode.EN, {
                TYPE: langType,
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
        hasPremium: boolean
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;

        if (customMessageResults.customMessages.length === 0) {
            embed = new MessageEmbed()
                .setDescription(
                    Lang.getRef('list.noCustomUserSpecificBirthdayMessages', LangCode.EN)
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
                        : `**${Lang.getRef('terms.unknownMember', LangCode.EN)}** `
                } ${customMessage.Message}\n\n`;
            } else {
                description += `${
                    member
                        ? `**${member.displayName}**: `
                        : `**${Lang.getRef('terms.unknownMember', LangCode.EN)}** `
                } ~~${customMessage.Message}~~\n\n`;
            }
        }

        let embedType = hasPremium ? 'list.customUserMessageFree' : 'list.customUserMessagePaid';

        embed = Lang.getEmbed(embedType, LangCode.EN, {
            PAGE: page.toString(),
            LIST_DATA: description,
            TOTAL_PAGES: customMessageResults.stats.TotalPages.toString(),
            TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
            PER_PAGE: Config.experience.birthdayMessageListSize.toString(),
        });

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
                .setDescription(Lang.getRef('list.noTrustedRoles', LangCode.EN))
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
                        : `**${Lang.getRef('terms.deletedRole', LangCode.EN)}** `
                }\n\n`;
            }
            i++;
        }

        if (
            !hasPremium &&
            trustedRoleResults.stats.TotalItems > Config.validation.trustedRoles.maxCount.free
        ) {
            embed = Lang.getEmbed('list.trustedRolePaid', LangCode.EN, {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: trustedRoleResults.stats.TotalPages.toString(),
                TOTAL_MESSAGES: trustedRoleResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.trustedRoleListSize.toString(),
                MAX_FREE: Config.validation.trustedRoles.maxCount.free.toString(),
                MAX_PAID: Config.validation.trustedRoles.maxCount.paid.toString(),
            });
        } else {
            embed = Lang.getEmbed('list.trustedRoleFree', LangCode.EN, {
                PAGE: page.toString(),
                LIST_DATA: description,
                TOTAL_PAGES: trustedRoleResults.stats.TotalPages.toString(),
                TOTAL_MESSAGES: trustedRoleResults.stats.TotalItems.toString(),
                PER_PAGE: Config.experience.trustedRoleListSize.toString(),
            });
        }

        return embed;
    }

    public static async getBirthdayListFullEmbed(
        guild: Guild,
        userDataResults: UserDataResults,
        page: number,
        pageSize: number
    ): Promise<MessageEmbed> {
        let embed: MessageEmbed;
        if (userDataResults.userData.length === 0) {
            let embed = new MessageEmbed()
                .setDescription(Lang.getRef('list.noBirthdays', LangCode.EN))
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
            let userNames: string[] = [];
            for (let user of users) {
                userNames.push(
                    `${guild.members.resolve(user.UserDiscordId)?.displayName}` ||
                        `**${Lang.getRef('terms.unknownMember', LangCode.EN)}**`
                );
            }
            let userList = this.joinWithAnd(userNames); // Get the sub list of usernames for this date
            description += `**${birthday}**: ${userList}\n`; // Append the description
        }

        embed = Lang.getEmbed('list.birthday', LangCode.EN, {
            PAGE: page.toString(),
            LIST_DATA: description,
            TOTAL_PAGES: userDataResults.stats.TotalPages.toString(),
            TOTAL_BIRTHDAYS: userDataResults.stats.TotalItems.toString(),
            PER_PAGE: Config.experience.birthdayListSize.toString(),
        });

        return embed;
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
                .setDescription(Lang.getRef('list.emptyBlacklist', LangCode.EN))
                .setColor(Config.colors.default);
            return embed;
        }
        let description = '';
        let users = blacklistResults.blacklist.map(data => data.UserDiscordId);

        for (let user of users) {
            description += `**${
                guild.members.resolve(user)?.displayName ||
                `**${Lang.getRef('terms.unknownMember', LangCode.EN)}**`
            }**: (ID: ${user})\n`; // Append the description
        }

        embed = Lang.getEmbed('list.blacklist', LangCode.EN, {
            PAGE: page.toString(),
            LIST_DATA: description,
            TOTAL_PAGES: blacklistResults.stats.TotalPages.toString(),
            TOTAL_BLACKLIST: blacklistResults.stats.TotalItems.toString(),
            PER_PAGE: Config.experience.blacklistSize.toString(),
        });

        return embed;
    }

    public static extractPageNumber(input: string): number {
        let match = PAGE_REGEX.exec(input);
        return match ? parseInt(match[1]) : null;
    }
}
