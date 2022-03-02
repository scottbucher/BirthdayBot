import { Guild, GuildMember, MessageEmbed, Role } from 'discord.js';
import moment from 'moment';
import { Moment } from 'moment-timezone';
import { createRequire } from 'node:module';

import { LangCode } from '../enums/index.js';
import {
    CustomMessage,
    GuildCelebrationData,
    GuildData,
    MemberAnniversaryRole,
    RawGuildCelebrationData,
    SplitUsers,
    TrustedRole,
    UserData,
} from '../models/database/index.js';
import { AnniversaryMemberStatus, BirthdayMemberStatus } from '../models/index.js';
import { Lang } from '../services/index.js';
import { ArrayUtils, ColorUtils, FormatUtils, TimeUtils } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class CelebrationUtils {
    public static getMessageColor(message: CustomMessage, hasPremium: boolean): any {
        let color = message.Color === '0' || !hasPremium ? Config.colors.default : null;

        color = !color
            ? '#' + ColorUtils.findHex(message?.Color) ?? Config.colors.default
            : Config.colors.default;

        return color;
    }

    public static getNextUsers(userDatas: UserData[], timeZone: string): UserData[] {
        let userTime = timeZone && timeZone !== '0' ? moment.tz(timeZone) : moment.tz();

        let { before: usersBefore, after: usersAfter } = this.splitUserDatasByTime(
            userDatas,
            userTime
        );

        if (usersAfter.length > 0) {
            let nextBirthday = usersAfter[0].Birthday; // First birthday after current date
            return usersAfter.filter(userData => userData.Birthday === nextBirthday); // TODO: Check by only month and day
        }

        if (usersBefore.length > 0) {
            let nextBirthday = usersBefore[0].Birthday; // First birthday starting at beginning of year
            return usersBefore.filter(userData => userData.Birthday === nextBirthday); // TODO: Check by only month and day
        }
    }

    public static splitUserDatasByTime(userDatas: UserData[], splitTime: Moment): SplitUsers {
        // TODO: Split into before and after, and sort by dates
        return {
            before: userDatas
                .filter(user => moment(user.Birthday).format('MM-DD') < splitTime.format('MM-DD'))
                .sort((a, b) => this.compareUserDatas(a, b)),
            after: userDatas
                .filter(user => moment(user.Birthday).format('MM-DD') > splitTime.format('MM-DD'))
                .sort((a, b) => this.compareUserDatas(a, b)),
        };
    }

    public static compareUserDatas(a: UserData, b: UserData): number {
        let aBday = moment(a.Birthday).format('MM-DD');
        let bBday = moment(b.Birthday).format('MM-DD');

        if (aBday > bBday) {
            return 1;
        }

        if (aBday < bBday) {
            return -1;
        }

        return 0;
    }

    // Might be better to combine this with getBirthdayMemberStatus
    public static isBirthdayTodayOrYesterday(userData: UserData, guildData: GuildData): boolean {
        if (!userData || !guildData) return false;

        // If the server doesn't have a default timezone, use the user's timezone
        // Else, since we have a server timezone, if the UseTimezone setting in the server does not prioritize the server, use the user's timezone
        // Else, use the server's default timezone
        let currentDate = moment().tz(
            guildData.DefaultTimezone === '0'
                ? userData.TimeZone
                : guildData.UseTimezone !== 'server'
                ? userData.TimeZone
                : guildData.DefaultTimezone
        );
        let birthday = moment(userData.Birthday);

        let currentDateFormatted = currentDate.format('MM-DD');
        let yesterdayDateFormatted = currentDate.subtract(1, 'day').format('MM-DD');
        let birthdayFormatted = birthday.format('MM-DD');

        if (birthdayFormatted === '02-29' && !TimeUtils.isLeap(moment().year()))
            birthdayFormatted = '02-28';

        // The date is correct, now check the time
        return (
            currentDateFormatted === birthdayFormatted ||
            yesterdayDateFormatted === birthdayFormatted
        );
    }

    public static getBirthdayMemberStatus(
        userData: UserData,
        guildMember: GuildMember,
        guildData: GuildData
    ): BirthdayMemberStatus {
        if (!userData || !guildData)
            return new BirthdayMemberStatus(guildMember, false, false, false);
        // If the server doesn't have a default timezone, use the user's timezone
        // Else, since we have a server timezone, if the UseTimezone setting in the server does not prioritize the server, use the user's timezone
        // Else, use the server's default timezone
        let currentDate = moment().tz(
            guildData.DefaultTimezone === '0'
                ? userData.TimeZone
                : guildData.UseTimezone !== 'server'
                ? userData.TimeZone
                : guildData.DefaultTimezone
        );
        let birthday = moment(userData.Birthday);

        let currentDateFormatted = currentDate.format('MM-DD');
        let birthdayFormatted = birthday.format('MM-DD');

        if (birthdayFormatted === '02-29' && !TimeUtils.isLeap(moment().year()))
            birthdayFormatted = '02-28';

        let currentHour = currentDate.hour();
        let needsBirthdayMessage: boolean;
        let needsBirthdayRoleAdded: boolean;
        let needsBirthdayRoleRemoved: boolean;
        if (currentDateFormatted === birthdayFormatted) {
            needsBirthdayMessage = currentHour === guildData.BirthdayMessageTime;
            needsBirthdayRoleAdded = currentHour === 0;
            needsBirthdayRoleRemoved = false;
        } else {
            needsBirthdayMessage = false;
            needsBirthdayRoleAdded = false;
            // I don't think I need to even subtract 1 hour from the birthday time, but I'm going to just in case
            needsBirthdayRoleRemoved = currentDate.subtract(1, 'days').hour() === 0;
        }

        return new BirthdayMemberStatus(
            guildMember,
            needsBirthdayMessage,
            needsBirthdayRoleAdded,
            needsBirthdayRoleRemoved
        );
    }

    public static getAnniversaryMemberStatuses(
        guildMember: GuildMember,
        guildData: GuildData,
        memberAnniversaryRoles: MemberAnniversaryRole[]
    ): AnniversaryMemberStatus {
        if (!guildMember || !guildData || guildData.DefaultTimezone === '0')
            return new AnniversaryMemberStatus(guildMember, false, null);

        let currentDate = moment().tz(guildData.DefaultTimezone);
        let memberAnniversary = moment(guildMember.joinedAt);

        if (currentDate.year() - memberAnniversary.year() === 0)
            return new AnniversaryMemberStatus(guildMember, false, null);

        let currentDateFormatted = currentDate.format('MM-DD');
        let anniversaryFormatted = memberAnniversary.format('MM-DD');

        if (anniversaryFormatted === '02-29' && !TimeUtils.isLeap(moment().year()))
            anniversaryFormatted = '02-28';

        if (currentDateFormatted !== anniversaryFormatted || guildMember.user.bot)
            return new AnniversaryMemberStatus(guildMember, false, null);

        let needsAnniversaryMessage = currentDate.hour() === guildData.MemberAnniversaryMessageTime;
        let role: Role;

        if (
            currentDate.hour() === 0 &&
            memberAnniversaryRoles &&
            memberAnniversaryRoles.length > 0
        ) {
            let anniversaryRole = memberAnniversaryRoles.find(
                role => CelebrationUtils.getMemberYears(guildMember, guildData) === role.Year
            );

            if (anniversaryRole) {
                try {
                    role = guildMember.guild.roles.resolve(
                        anniversaryRole.MemberAnniversaryRoleDiscordId
                    );
                } catch (error) {
                    // No Member Anniversary Role
                }
            }
        }

        return new AnniversaryMemberStatus(guildMember, needsAnniversaryMessage, role);
    }

    public static isServerAnniversaryMessage(guild: Guild, guildData: GuildData): boolean {
        if (!guild || !guildData || guildData.DefaultTimezone === '0') return false;
        let currentDate = moment().tz(guildData.DefaultTimezone);
        let serverAnniversary = moment(guild.createdAt);

        let currentDateFormatted = currentDate.format('MM-DD');
        let anniversaryFormatted = serverAnniversary.format('MM-DD');

        if (anniversaryFormatted === '02-29' && !TimeUtils.isLeap(moment().year()))
            anniversaryFormatted = '02-28';

        // The date is correct, now check the time
        return currentDateFormatted !== anniversaryFormatted
            ? false
            : currentDate.hour() !== guildData.ServerAnniversaryMessageTime
            ? false
            : true;
    }

    public static getMemberYears(guildMember: GuildMember, guildData: GuildData): number {
        if (!guildMember || !guildData || !guildData.DefaultTimezone) return 0;
        let currentYear = moment().tz(guildData.DefaultTimezone).year();
        let memberAnniversaryYear = moment(guildMember.joinedAt).year();
        return currentYear - memberAnniversaryYear;
    }

    public static getServerYears(guild: Guild, guildData: GuildData): number {
        if (!guild || !guildData || !guildData.DefaultTimezone) return 0;
        let currentYear = moment().tz(guildData.DefaultTimezone).year();
        let memberAnniversaryYear = moment(guild.createdAt).year();
        return currentYear - memberAnniversaryYear;
    }

    // Change input to just take an array of CustomMessage
    public static randomMessage(
        messages: CustomMessage[],
        hasPremium: boolean,
        type: string
    ): CustomMessage {
        if (messages.length > 0) {
            if (hasPremium) {
                // Choose a random one
                return ArrayUtils.chooseRandom(messages);
            } else {
                // Only choose from the first 10
                return ArrayUtils.chooseRandom(
                    type === 'birthday'
                        ? messages.slice(0, Config.validation.message.maxCount.birthday.free)
                        : type === 'memberanniversary'
                        ? messages.slice(
                              0,
                              Config.validation.message.maxCount.memberAnniversary.free
                          )
                        : messages.slice(
                              0,
                              Config.validation.message.maxCount.serverAnniversary.free
                          )
                );
            }
        } else {
            // Return null
            return null;
        }
    }

    public static getMentionString(guildData: GuildData, guild: Guild, type: string): string {
        // Find mentioned role
        let mentionSetting = (
            type === 'birthday'
                ? guildData.BirthdayMentionSetting
                : type === 'memberanniversary'
                ? guildData.MemberAnniversaryMentionSetting
                : guildData.ServerAnniversaryMentionSetting
        ).toLowerCase();

        if (mentionSetting === '0') return null;

        if (mentionSetting === 'here') {
            return '@here';
        }

        if (mentionSetting === guild.id || mentionSetting === 'everyone') {
            return '@everyone';
        }

        return `<@&${mentionSetting}>`;
    }

    public static replacePlaceHolders(
        message: string,
        guild: Guild,
        type: string,
        userList: string,
        year: number
    ): string {
        if (message) {
            message = message.replaceAll(
                Lang.getRegex('info', 'placeHolders.serverRegex', LangCode.EN_US),
                guild.name
            );

            if (type !== 'serveranniversary')
                message = message.replaceAll(
                    Lang.getRegex('info', 'placeHolders.usersRegex', LangCode.EN_US),
                    userList
                );
            if (type !== 'birthday')
                message = message.replaceAll(
                    Lang.getRegex('info', 'placeHolders.yearRegex', LangCode.EN_US),
                    year?.toString()
                );
        }

        return message;
    }

    public static replaceLangPlaceHolders(
        message: string,
        guild: Guild,
        type: string,
        userId: string
    ): string {
        if (message) {
            let serverPlaceholder = Lang.getRef('info', 'placeHolders.server', LangCode.EN_US);
            message = message.replaceAll(
                Lang.getRegex('info', 'placeHolders.serverRegex', LangCode.EN_US),
                serverPlaceholder
            );

            if (type !== 'serveranniversary') {
                let userPlaceholder = Lang.getRef('info', 'placeHolders.users', LangCode.EN_US);
                message = message.replaceAll(
                    Lang.getRegex('info', 'placeHolders.usersRegex', LangCode.EN_US),
                    userId ? `${userId}` : userPlaceholder
                );
            }
            if (type !== 'birthday') {
                let yearPlaceholder = Lang.getRef('info', 'placeHolders.year', LangCode.EN_US);
                message = message.replaceAll(
                    Lang.getRegex('info', 'placeHolders.yearRegex', LangCode.EN_US),
                    yearPlaceholder
                );
            }
        }

        return message;
    }

    public static getCelebrationMessage(
        guild: Guild,
        guildData: GuildData,
        customMessages: CustomMessage[],
        type: string,
        celebrationMembers: GuildMember[],
        year: number,
        hasPremium: boolean
    ): MessageEmbed | string {
        let message =
            type === 'birthday'
                ? Lang.getRef('info', 'defaults.birthdayMessage', LangCode.EN_US)
                : type === 'memberanniversary'
                ? Lang.getRef('info', 'defaults.memberAnniversaryMessage', LangCode.EN_US)
                : Lang.getRef('info', 'defaults.serverAnniversaryMessage', LangCode.EN_US);
        let color = Config.colors.default;
        let useEmbed = true;

        let userList: string;

        // Compile our user list to put in the message
        if (type !== 'serveranniversary')
            userList = CelebrationUtils.getUserListString(guildData, celebrationMembers);

        // Add the compiled user list
        if (customMessages.length > 0) {
            // Get our custom message
            let customMessage = CelebrationUtils.randomMessage(customMessages, hasPremium, type);

            // Find the color of the embed
            color = CelebrationUtils.getMessageColor(customMessage, hasPremium);
            useEmbed = customMessage.Embed ? true : false;

            message = customMessage.Message;
        }

        // Replace the placeholders
        message = CelebrationUtils.replacePlaceHolders(message, guild, type, userList, year);

        let embed = new MessageEmbed().setDescription(message).setColor(color);

        return useEmbed ? embed : message;
    }

    public static getUserSpecificCelebrationMessage(
        guild: Guild,
        guildData: GuildData,
        customMessage: CustomMessage,
        celebrationMember: GuildMember,
        year: number,
        hasPremium: boolean
    ): MessageEmbed | string {
        let message: string;
        let color = Config.colors.default;

        // Compile our user list to put in the message
        let userList = CelebrationUtils.getUserListString(guildData, [celebrationMember]);

        // Replace the placeholders
        message = CelebrationUtils.replacePlaceHolders(
            customMessage.Message,
            guild,
            customMessage.Type,
            userList,
            year
        );

        // Find the color of the embed
        color = CelebrationUtils.getMessageColor(customMessage, hasPremium);

        let embed = new MessageEmbed().setDescription(message).setColor(color);

        return customMessage.Embed ? embed : message;
    }

    public static getUserListString(guildData: GuildData, guildMember: GuildMember[]): string {
        // Find mentioned role
        let userList: string;
        // Format the user list based off the servers name format
        if (guildData?.NameFormat === 'username')
            userList = FormatUtils.joinWithAnd(
                guildMember.map(member => `**${member.user.username}**`)
            );
        else if (guildData?.NameFormat === 'nickname')
            userList = FormatUtils.joinWithAnd(
                guildMember.map(member => `**${member.displayName}**`)
            );
        else if (guildData?.NameFormat === 'tag')
            userList = FormatUtils.joinWithAnd(
                guildMember.map(
                    member => `**${member.user.username}#${member.user.discriminator}**`
                )
            );
        else userList = FormatUtils.joinWithAnd(guildMember.map(member => member.toString()));
        return userList;
    }

    public static passesTrustedCheck(
        requireAllTrustedRoles: number,
        trustedRoles: Role[],
        birthdayMember: GuildMember,
        trustedSetting: number,
        hasPremium: boolean
    ): boolean {
        // If it passed the trusted role(s) check
        // Default this to true if there are no trusted roles
        // If there are trusted roles and trusted DOESN'T prevent Role/Message (the trusted setting passed in) then set it to true
        let passTrustedCheck =
            !trustedRoles || (trustedRoles.length === 0 ? true : trustedSetting ? false : true);

        // if passTrustedCheck is already true we don't have to check for trusted role(s)
        if (!passTrustedCheck) {
            trustedRoles = hasPremium ? trustedRoles : [trustedRoles[0]];
            if (requireAllTrustedRoles) {
                let hasAllTrusted = true;
                for (let role of trustedRoles) {
                    if (!birthdayMember.roles.cache.has(role.id)) {
                        hasAllTrusted = false;
                        break;
                    }
                }
                passTrustedCheck = hasAllTrusted;
            } else {
                for (let role of trustedRoles) {
                    if (birthdayMember.roles.cache.has(role.id)) {
                        passTrustedCheck = true;
                        break;
                    }
                }
            }
        }
        return passTrustedCheck;
    }

    public static async getTrustedRoleList(guild: Guild, roles: TrustedRole[]): Promise<Role[]> {
        let trustedRoles: Role[] = [];
        for (let role of roles) {
            try {
                let tRole: Role = await guild.roles.fetch(role.TrustedRoleDiscordId);
                if (tRole) trustedRoles.push(tRole);
            } catch (error) {
                // Trusted role is invalid
            }
        }
        return trustedRoles;
    }

    public static async getMemberAnniversaryRoleList(
        guild: Guild,
        roles: MemberAnniversaryRole[]
    ): Promise<Role[]> {
        let memberAnniversaryRoles: Role[] = [];
        for (let role of roles) {
            try {
                let tRole: Role = await guild.roles.fetch(role.MemberAnniversaryRoleDiscordId);
                if (tRole) memberAnniversaryRoles.push(tRole);
            } catch (error) {
                // Member Anniversary role is invalid
            }
        }
        return memberAnniversaryRoles;
    }

    public static canGiveAllRoles(guild: Guild, roles: Role[], guildMember: GuildMember): boolean {
        if (!roles) return true;
        let check = true;
        for (let role of roles) {
            // See if the bot can give the roles
            let highestBotRole = guild.members.resolve(guild.client.user).roles.highest.position;
            // If a user isn't given and we test against the bot the last boolean will always be false
            check =
                role &&
                role.position < highestBotRole &&
                (guildMember.user.bot || guildMember.roles.highest.position < highestBotRole);
            if (!check) return false;
        }
        return true;
    }

    public static convertCelebrationData(
        rawGuildCelebrationData: RawGuildCelebrationData
    ): GuildCelebrationData[] {
        let dataSet: GuildCelebrationData[] = [];

        for (let rawData of rawGuildCelebrationData.guildDatas) {
            let celebrationData = new GuildCelebrationData();
            celebrationData.guildData = rawData;
            celebrationData.customMessages = rawGuildCelebrationData.customMessages.filter(
                c => c.GuildId === rawData.GuildId
            );
            celebrationData.blacklist = rawGuildCelebrationData.blacklist.filter(
                b => b.GuildId === rawData.GuildId
            );
            celebrationData.trustedRoles = rawGuildCelebrationData.trustedRoles.filter(
                t => t.GuildId === rawData.GuildId
            );
            celebrationData.anniversaryRoles = rawGuildCelebrationData.anniversaryRoles.filter(
                ar => ar.GuildId === rawData.GuildId
            );
            dataSet.push(celebrationData);
        }

        return dataSet;
    }
}
