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
        let embed = new MessageEmbed()
            .setThumbnail(guild.iconURL())
            .setColor(Config.colors.default)
            .setFooter(
                Lang.getRef('listFooter', LangCode.EN, {
                    TYPE: Lang.getRef('messages', LangCode.EN),
                    TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
                    PER_PAGE: Config.experience.birthdayMessageListSize.toString(),
                }),
                guild.iconURL()
            )
            .setTimestamp();

        let i = (page - 1) * pageSize + 1;

        if (customMessageResults.customMessages.length === 0) {
            let embed = new MessageEmbed()
                .setColor(Config.colors.default)
                .setDescription(
                    type === 'birthday'
                        ? Lang.getRef('noCustomBirthdayMessages', LangCode.EN)
                        : type === 'memberanniversary'
                        ? Lang.getRef('noCustomMemberAnniversaryMessages', LangCode.EN)
                        : Lang.getRef('noCustomServerAnniversaryMessages', LangCode.EN)
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

        embed.setTitle(
            Lang.getRef('listTitle', LangCode.EN, {
                TYPE:
                    Lang.getRef(langType, LangCode.EN) + ' ' + Lang.getRef('messages', LangCode.EN),
                PAGE: page.toString(),
                TOTAL_PAGES: customMessageResults.stats.TotalPages.toString(),
            })
        );

        description += Lang.getRef('messageListDescription', LangCode.EN, {
            TYPE: Lang.getRef(langType, LangCode.EN),
        });

        if (!hasPremium && customMessageResults.stats.TotalItems > maxMessagesFree)
            embed.addField(
                Lang.getRef('messageListPremiumFieldTitle', LangCode.EN),
                Lang.getRef('messageListPremiumFieldText', LangCode.EN, {
                    MAX_FREE_MESSAGES: maxMessagesFree.toString(),
                    TYPE: Lang.getRef('birthday', LangCode.EN),
                    MAX_PAID_MESSAGES: maxMessagesPaid.toString(),
                })
            );

        embed.setDescription(description);

        return embed;
    }

    public static async getCustomUserMessageListEmbed(
        guild: Guild,
        customMessageResults: CustomMessages,
        page: number,
        pageSize: number,
        hasPremium: boolean
    ): Promise<MessageEmbed> {
        let embed = new MessageEmbed()
            .setTitle(
                Lang.getRef('listTitle', LangCode.EN, {
                    TYPE: Lang.getRef('user', LangCode.EN) + ' Messages',
                    PAGE: page.toString(),
                    TOTAL_PAGES: customMessageResults.stats.TotalPages.toString(),
                })
            )
            .setThumbnail(guild.iconURL())
            .setColor(Config.colors.default)
            .setFooter(
                Lang.getRef('messageListFooter', LangCode.EN, {
                    TYPE:
                        Lang.getRef('total', LangCode.EN) +
                        ' ' +
                        Lang.getRef('messages', LangCode.EN),
                    TOTAL_MESSAGES: customMessageResults.stats.TotalItems.toString(),
                    PER_PAGE: Config.experience.birthdayMessageListSize.toString(),
                }),
                guild.iconURL()
            )
            .setTimestamp();

        if (customMessageResults.customMessages.length === 0) {
            let embed = new MessageEmbed()
                .setDescription(Lang.getRef('noCustomUserSpecificBirthdayMessages', LangCode.EN))
                .setColor(Config.colors.default);
            return embed;
        }
        let description = Lang.getRef('userBirthdayMessageListDescription', LangCode.EN);

        for (let customMessage of customMessageResults.customMessages) {
            let member = guild.members.resolve(customMessage.UserDiscordId);
            if (hasPremium) {
                description += `${
                    member
                        ? `**${member.displayName}**: `
                        : `**${Lang.getRef('unknownMember', LangCode.EN)}** `
                } ${customMessage.Message}\n\n`;
            } else {
                description += `${
                    member
                        ? `**${member.displayName}**: `
                        : `**${Lang.getRef('unknownMember', LangCode.EN)}** `
                } ~~${customMessage.Message}~~\n\n`;
            }
        }

        if (!hasPremium)
            embed.addField(
                Lang.getRef('userBirthdayMessageListFieldTitle', LangCode.EN),
                Lang.getRef('userBirthdayMessageListFieldText', LangCode.EN)
            );

        embed.setDescription(description);

        return embed;
    }

    public static async getTrustedRoleList(
        guild: Guild,
        trustedRoleResults: TrustedRoles,
        page: number,
        pageSize: number,
        hasPremium: boolean
    ): Promise<MessageEmbed> {
        let embed = new MessageEmbed()
            .setTitle(
                Lang.getRef('listTitle', LangCode.EN, {
                    TYPE: Lang.getRef('trustedRoles', LangCode.EN),
                    PAGE: page.toString(),
                    TOTAL_PAGES: trustedRoleResults.stats.TotalPages.toString(),
                })
            )
            .setThumbnail(guild.iconURL())
            .setColor(Config.colors.default)
            .setFooter(
                Lang.getRef('listFooter', LangCode.EN, {
                    TYPE: Lang.getRef('trustedRoles', LangCode.EN),
                    TOTAL_MESSAGES: trustedRoleResults.stats.TotalItems.toString(),
                    PER_PAGE: Config.experience.trustedRoleListSize.toString(),
                }),
                guild.iconURL()
            )
            .setTimestamp();

        let i = (page - 1) * pageSize + 1;

        if (trustedRoleResults.trustedRoles.length === 0) {
            let embed = new MessageEmbed()
                .setDescription(Lang.getRef('noTrustedRoles', LangCode.EN))
                .setColor(Config.colors.default);
            return embed;
        }
        let description = Lang.getRef('trustedRoleListDescription', LangCode.EN);

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
                        : `**${Lang.getRef('deletedRole', LangCode.EN)}** `
                }\n\n`;
            }
            i++;
        }

        if (
            !hasPremium &&
            trustedRoleResults.stats.TotalItems > Config.validation.trustedRoles.maxCount.free
        )
            embed.addField(
                Lang.getRef('trustedRoleListFieldTitle', LangCode.EN),
                Lang.getRef('trustedRoleListFieldText', LangCode.EN, {
                    MAX_FREE_TRUSTED_ROLES: Config.validation.trustedRoles.maxCount.free.toString(),
                    MAX_PAID_TRUSTED_ROLES: Config.validation.trustedRoles.maxCount.paid.toString(),
                })
            );

        embed.setDescription(description);

        return embed;
    }

    public static async getBirthdayListFullEmbed(
        guild: Guild,
        userDataResults: UserDataResults,
        page: number,
        pageSize: number
    ): Promise<MessageEmbed> {
        let embed = new MessageEmbed()
            .setTitle(
                Lang.getRef('listTitle', LangCode.EN, {
                    TYPE:
                        Lang.getRef('birthday', LangCode.EN) +
                        ' ' +
                        Lang.getRef('list', LangCode.EN),
                    PAGE: page.toString(),
                    TOTAL_PAGES: userDataResults.stats.TotalPages.toString(),
                })
            )
            .setThumbnail(guild.iconURL())
            .setColor(Config.colors.default)
            .setFooter(
                Lang.getRef('listFooter', LangCode.EN, {
                    TYPE: Lang.getRef('birthdays', LangCode.EN),
                    TOTAL_MESSAGES: userDataResults.stats.TotalItems.toString(),
                    PER_PAGE: Config.experience.trustedRoleListSize.toString(),
                }),
                guild.iconURL()
            )
            .setTimestamp();

        if (userDataResults.userData.length === 0) {
            let embed = new MessageEmbed()
                .setDescription(Lang.getRef('noBirthdays', LangCode.EN))
                .setColor(Config.colors.default);
            return embed;
        }
        let description = Lang.getRef('birthdayListDescription', LangCode.EN);
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
                        `**${Lang.getRef('unknownMember', LangCode.EN)}**`
                );
            }
            let userList = this.joinWithAnd(userNames); // Get the sub list of usernames for this date
            description += `**${birthday}**: ${userList}\n`; // Append the description
        }

        embed.setDescription(description);

        return embed;
    }

    public static async getBlacklistFullEmbed(
        guild: Guild,
        blacklistResults: Blacklisted,
        page: number,
        pageSize: number
    ): Promise<MessageEmbed> {
        let embed = new MessageEmbed()
            .setTitle(
                Lang.getRef('listTitle', LangCode.EN, {
                    TYPE:
                        Lang.getRef('birthday', LangCode.EN) +
                        ' ' +
                        Lang.getRef('blacklist', LangCode.EN),
                    PAGE: page.toString(),
                    TOTAL_PAGES: blacklistResults.stats.TotalPages.toString(),
                })
            )
            .setThumbnail(guild.iconURL())
            .setColor(Config.colors.default)
            .setFooter(
                Lang.getRef('listFooter', LangCode.EN, {
                    TYPE:
                        Lang.getRef('blacklisted', LangCode.EN) +
                        ' ' +
                        Lang.getRef('users', LangCode.EN),
                    TOTAL_MESSAGES: blacklistResults.stats.TotalItems.toString(),
                    PER_PAGE: Config.experience.trustedRoleListSize.toString(),
                }),
                guild.iconURL()
            )
            .setTimestamp();

        if (blacklistResults.blacklist.length === 0) {
            let embed = new MessageEmbed()
                .setDescription(Lang.getRef('emptyBlacklist', LangCode.EN))
                .setColor(Config.colors.default);
            return embed;
        }
        let description = Lang.getRef('blacklistDescription', LangCode.EN);
        let users = blacklistResults.blacklist.map(data => data.UserDiscordId);

        for (let user of users) {
            description += `**${
                guild.members.resolve(user)?.displayName ||
                `**${Lang.getRef('unknownMember', LangCode.EN)}**`
            }**: (ID: ${user})\n`; // Append the description
        }

        embed.setDescription(description);

        return embed;
    }

    public static extractPageNumber(input: string): number {
        let match = PAGE_REGEX.exec(input);
        return match ? parseInt(match[1]) : null;
    }
}
