import { EmbedBuilder, Guild, GuildMember, Locale, Role } from 'discord.js';
import { DateTime } from 'luxon';
import { createRequire } from 'node:module';

import { GuildData, MemberAnniversaryRoleData } from '../database/entities/index.js';
import { MessageData } from '../database/entities/message.js';
import { UserData } from '../database/entities/user.js';
import { CelebrationType } from '../enums/celebration-type.js';
import { NameFormat } from '../enums/name-format.js';
import { AnniversaryMemberStatus, BirthdayMemberStatus, SplitUsers } from '../models/index.js';
import { Lang } from '../services/index.js';
import { ArrayUtils, ColorUtils, FormatUtils, TimeUtils } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class CelebrationUtils {
    public static getMessageColor(message: MessageData, hasPremium: boolean): any {
        let color = message.color === '0' || !hasPremium ? Config.colors.default : null;

        color = !color
            ? '#' + ColorUtils.findHex(message?.color) ?? Config.colors.default
            : Config.colors.default;

        return color;
    }

    public static getNextUsers(userDatas: UserData[], timeZone: string): UserData[] {
        let userTime =
            timeZone && timeZone !== '0' ? DateTime.local({ zone: timeZone }) : DateTime.now();

        let { before: usersBefore, after: usersAfter } = this.splitUserDatasByTime(
            userDatas,
            userTime
        );

        if (usersAfter.length > 0) {
            let nextBirthday = usersAfter[0].birthday; // First birthday after current date
            return usersAfter.filter(userData => userData.birthday === nextBirthday); // TODO: Check by only month and day
        }

        if (usersBefore.length > 0) {
            let nextBirthday = usersBefore[0].birthday; // First birthday starting at beginning of year
            return usersBefore.filter(userData => userData.birthday === nextBirthday); // TODO: Check by only month and day
        }
    }

    public static splitUserDatasByTime(userDatas: UserData[], splitTime: DateTime): SplitUsers {
        // TODO: Split into before and after, and sort by dates
        return {
            before: userDatas
                .filter(
                    user =>
                        DateTime.fromFormat(user.birthday, 'LL-d').toFormat('LL-dd') <
                        splitTime.toFormat('LL-dd')
                )
                .sort((a, b) => this.compareUserDatas(a, b)),
            after: userDatas
                .filter(
                    user =>
                        DateTime.fromFormat(user.birthday, 'LL-d').toFormat('LL-dd') >
                        splitTime.toFormat('LL-dd')
                )
                .sort((a, b) => this.compareUserDatas(a, b)),
        };
    }

    public static compareUserDatas(a: UserData, b: UserData): number {
        let aBday = DateTime.fromFormat(a.birthday, 'LL-d').toFormat('LL-dd');
        let bBday = DateTime.fromFormat(b.birthday, 'LL-d').toFormat('LL-dd');

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
        let currentDate = TimeUtils.getCurrentDateTime(
            guildData.guildSettings.timeZone,
            userData.timeZone,
            guildData.birthdaySettings.useTimeZone
        );

        let birthday = DateTime.fromFormat(userData.birthday, 'LL-d');

        let currentDateFormatted = currentDate.toFormat('LL-dd');
        let yesterdayDateFormatted = currentDate.minus({ days: 1 }).toFormat('LL-dd');
        let birthdayFormatted = birthday.toFormat('LL-dd');

        if (birthdayFormatted === '02-29' && !TimeUtils.isLeap(DateTime.now().year))
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
        let currentDate = TimeUtils.getCurrentDateTime(
            guildData.guildSettings.timeZone,
            userData.timeZone,
            guildData.birthdaySettings.useTimeZone
        );

        let birthday = DateTime.fromFormat(userData.birthday, 'LL-d');

        let currentDateFormatted = currentDate.toFormat('LL-dd');
        let birthdayFormatted = birthday.toFormat('LL-dd');

        if (birthdayFormatted === '02-29' && !TimeUtils.isLeap(DateTime.now().year))
            birthdayFormatted = '02-28';

        let currentHour = currentDate.hour;
        let needsBirthdayMessage: boolean;
        let needsBirthdayRoleAdded: boolean;
        let needsBirthdayRoleRemoved: boolean;
        if (currentDateFormatted === birthdayFormatted) {
            needsBirthdayMessage = currentHour === guildData.birthdaySettings.postHour;
            needsBirthdayRoleAdded = currentHour === 0;
            needsBirthdayRoleRemoved = false;
        } else {
            needsBirthdayMessage = false;
            needsBirthdayRoleAdded = false;
            // I don't think I need to even subtract 1 hour from the birthday time, but I'm going to just in case
            needsBirthdayRoleRemoved = currentDate.minus({ days: 1 }).hour === 0;
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
        memberAnniversaryRoles: MemberAnniversaryRoleData[]
    ): AnniversaryMemberStatus {
        if (!guildMember || !guildData || !guildData.guildSettings.timeZone)
            return new AnniversaryMemberStatus(guildMember, false, null);

        let currentDate = DateTime.local({ zone: guildData.guildSettings.timeZone });
        let memberAnniversary = DateTime.fromJSDate(guildMember.joinedAt);

        if (currentDate.year - memberAnniversary.year === 0)
            return new AnniversaryMemberStatus(guildMember, false, null);

        let currentDateFormatted = currentDate.toFormat('LL-dd');
        let anniversaryFormatted = memberAnniversary.toFormat('LL-dd');

        if (anniversaryFormatted === '02-29' && !TimeUtils.isLeap(DateTime.now().year))
            anniversaryFormatted = '02-28';

        if (currentDateFormatted !== anniversaryFormatted || guildMember.user.bot)
            return new AnniversaryMemberStatus(guildMember, false, null);

        let needsAnniversaryMessage =
            currentDate.hour === guildData.memberAnniversarySettings.postHour;
        let role: Role;

        if (currentDate.hour === 0 && memberAnniversaryRoles && memberAnniversaryRoles.length > 0) {
            let anniversaryRole = memberAnniversaryRoles.find(
                role => CelebrationUtils.getMemberYears(guildMember, guildData) === role.year
            );

            if (anniversaryRole) {
                try {
                    role = guildMember.guild.roles.resolve(anniversaryRole.discordId);
                } catch (error) {
                    // No Member Anniversary Role
                }
            }
        }

        return new AnniversaryMemberStatus(guildMember, needsAnniversaryMessage, role);
    }

    public static isServerAnniversaryMessage(guild: Guild, guildData: GuildData): boolean {
        if (!guild || !guildData || !guildData.guildSettings.timeZone) return false;
        let currentDate = DateTime.local({ zone: guildData.guildSettings.timeZone });
        let serverAnniversary = DateTime.fromJSDate(guild.createdAt);

        let currentDateFormatted = currentDate.toFormat('LL-dd');
        let anniversaryFormatted = serverAnniversary.toFormat('LL-dd');

        if (anniversaryFormatted === '02-29' && !TimeUtils.isLeap(DateTime.now().year))
            anniversaryFormatted = '02-28';

        // The date is correct, now check the time
        return currentDateFormatted !== anniversaryFormatted
            ? false
            : currentDate.hour !== guildData.serverAnniversarySettings.postHour
            ? false
            : true;
    }

    public static getMemberYears(guildMember: GuildMember, guildData: GuildData): number {
        if (!guildMember || !guildData || !guildData.guildSettings.timeZone) return 0;
        let currentYear = DateTime.local({ zone: guildData.guildSettings.timeZone }).year;
        let memberAnniversaryYear = DateTime.fromJSDate(guildMember.joinedAt).year;
        return currentYear - memberAnniversaryYear;
    }

    public static getServerYears(guild: Guild, guildData: GuildData): number {
        if (!guild || !guildData || !guildData.guildSettings.timeZone) return 0;
        let currentYear = DateTime.local({ zone: guildData.guildSettings.timeZone }).year;
        let memberAnniversaryYear = DateTime.fromJSDate(guild.createdAt).year;
        return currentYear - memberAnniversaryYear;
    }

    // Change input to just take an array of CustomMessage
    public static randomMessage(
        messages: MessageData[],
        hasPremium: boolean,
        type: string
    ): MessageData {
        if (messages.length > 0) {
            if (hasPremium) {
                // Choose a random one
                return ArrayUtils.chooseRandom(messages);
            } else {
                // Only choose from the first 10
                return ArrayUtils.chooseRandom(
                    type === 'birthday'
                        ? messages.slice(0, Config.validation.message.maxCount.birthday.free)
                        : type === 'memberanniversary' || type === 'member_anniversary'
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

    // TODO: writing here because I don't have a better place but ensure all types have been converted to enums even when used to construct the lang location string
    // Like memberanniversary vs member_anniversary etc.
    public static getMentionString(
        guildData: GuildData,
        guild: Guild,
        type: CelebrationType
    ): string {
        return type === CelebrationType.BIRTHDAY
            ? guildData.birthdaySettings.ping
            : type === CelebrationType.MEMBER_ANNIVERSARY
            ? guildData.memberAnniversarySettings.ping
            : guildData.serverAnniversarySettings.ping;
    }

    public static replacePlaceHolders(
        message: string,
        guild: Guild,
        type: CelebrationType,
        userList: string,
        year: number,
        langCode: Locale
    ): string {
        if (message) {
            message = message.replaceAll(
                Lang.getRegex('info', 'placeHolders.serverRegex', langCode),
                guild.name
            );

            if (type !== CelebrationType.SERVER_ANNIVERSARY)
                message = message.replaceAll(
                    Lang.getRegex('info', 'placeHolders.usersRegex', langCode),
                    userList
                );
            if (type !== CelebrationType.BIRTHDAY)
                message = message.replaceAll(
                    Lang.getRegex('info', 'placeHolders.yearRegex', langCode),
                    year?.toString()
                );
        }

        return message;
    }

    public static replaceLangPlaceHolders(
        message: string,
        guild: Guild,
        type: CelebrationType,
        userId: string,
        langCode: Locale
    ): string {
        if (message) {
            let serverPlaceholder = Lang.getRef('info', 'placeHolders.server', langCode);
            message = message.replaceAll(
                Lang.getRegex('info', 'placeHolders.serverRegex', langCode),
                serverPlaceholder
            );

            if (type !== CelebrationType.SERVER_ANNIVERSARY) {
                let userPlaceholder = Lang.getRef('info', 'placeHolders.users', langCode);
                message = message.replaceAll(
                    Lang.getRegex('info', 'placeHolders.usersRegex', langCode),
                    userId ? `${userId}` : userPlaceholder
                );
            }
            if (type !== CelebrationType.BIRTHDAY) {
                let yearPlaceholder = Lang.getRef('info', 'placeHolders.year', langCode);
                message = message.replaceAll(
                    Lang.getRegex('info', 'placeHolders.yearRegex', langCode),
                    yearPlaceholder
                );
            }
        }

        return message;
    }

    public static getCelebrationMessage(
        guild: Guild,
        guildData: GuildData,
        customMessages: MessageData[],
        type: CelebrationType,
        celebrationMembers: GuildMember[],
        year: number,
        hasPremium: boolean,
        langCode: Locale
    ): EmbedBuilder | string {
        let message =
            type === CelebrationType.BIRTHDAY
                ? Lang.getRef('info', 'defaults.birthdayMessage', langCode)
                : type === CelebrationType.MEMBER_ANNIVERSARY
                ? Lang.getRef('info', 'defaults.memberAnniversaryMessage', langCode)
                : Lang.getRef('info', 'defaults.serverAnniversaryMessage', langCode);
        let color = Config.colors.default;
        let useEmbed = true;

        let userList: string;

        // Compile our user list to put in the message
        if (type !== CelebrationType.SERVER_ANNIVERSARY)
            userList = CelebrationUtils.getUserListString(guildData, celebrationMembers, langCode);

        // Add the compiled user list
        if (customMessages.length > 0) {
            // Get our custom message
            let customMessage = CelebrationUtils.randomMessage(customMessages, hasPremium, type);

            // Find the color of the embed
            color = CelebrationUtils.getMessageColor(customMessage, hasPremium);
            useEmbed = customMessage.embedded ? true : false;

            message = customMessage.description;
        }

        // Replace the placeholders
        message = CelebrationUtils.replacePlaceHolders(
            message,
            guild,
            type,
            userList,
            year,
            langCode
        );

        let embed = new EmbedBuilder().setDescription(message).setColor(color);

        return useEmbed ? embed : message;
    }

    public static getUserSpecificCelebrationMessage(
        guild: Guild,
        guildData: GuildData,
        customMessage: MessageData,
        celebrationMember: GuildMember,
        year: number,
        hasPremium: boolean,
        langCode: Locale
    ): EmbedBuilder | string {
        let message: string;
        let color = Config.colors.default;

        // Compile our user list to put in the message
        let userList = CelebrationUtils.getUserListString(guildData, [celebrationMember], langCode);

        // Replace the placeholders
        message = CelebrationUtils.replacePlaceHolders(
            customMessage.description,
            guild,
            customMessage.type,
            userList,
            year,
            langCode
        );

        // Find the color of the embed
        color = CelebrationUtils.getMessageColor(customMessage, hasPremium);

        let embed = new EmbedBuilder().setDescription(message).setColor(color);

        return customMessage.embedded ? embed : message;
    }

    public static getUserListString(
        guildData: GuildData,
        guildMember: GuildMember[],
        langCode: Locale
    ): string {
        // Find mentioned role
        let userList: string;
        // Format the user list based off the servers name format
        if (guildData?.formatSettings.name === NameFormat.USERNAME)
            userList = FormatUtils.joinWithAnd(
                guildMember.map(member => `**${member.user.username}**`),
                langCode
            );
        else if (guildData?.formatSettings.name === NameFormat.NICKNAME)
            userList = FormatUtils.joinWithAnd(
                guildMember.map(member => `**${member.displayName}**`),
                langCode
            );
        else if (guildData?.formatSettings.name === NameFormat.TAG)
            userList = FormatUtils.joinWithAnd(
                guildMember.map(
                    member => `**${member.user.username}#${member.user.discriminator}**`
                ),
                langCode
            );
        else
            userList = FormatUtils.joinWithAnd(
                guildMember.map(member => member.toString()),
                langCode
            );
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

    public static async getTrustedRoleList(guild: Guild, roldIds: string[]): Promise<Role[]> {
        let trustedRoles: Role[] = [];
        for (let roleId of roldIds) {
            try {
                let tRole: Role = await guild.roles.fetch(roleId);
                if (tRole) trustedRoles.push(tRole);
            } catch (error) {
                // Trusted role is invalid
            }
        }
        return trustedRoles;
    }

    public static async getMemberAnniversaryRoleList(
        guild: Guild,
        roles: MemberAnniversaryRoleData[]
    ): Promise<Role[]> {
        let memberAnniversaryRoles: Role[] = [];
        for (let role of roles) {
            try {
                let mRole: Role = await guild.roles.fetch(role.discordId);
                if (mRole) memberAnniversaryRoles.push(mRole);
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

    // public static convertCelebrationData(
    //     rawGuildCelebrationData: RawGuildCelebrationData
    // ): GuildCelebrationData[] {
    //     let dataSet: GuildCelebrationData[] = [];

    //     for (let rawData of rawGuildCelebrationData.guildDatas) {
    //         let celebrationData = new GuildCelebrationData();
    //         celebrationData.guildData = rawData;
    //         celebrationData.customMessages = rawGuildCelebrationData.customMessages.filter(
    //             c => c.GuildId === rawData.GuildId
    //         );
    //         celebrationData.blacklist = rawGuildCelebrationData.blacklist.filter(
    //             b => b.GuildId === rawData.GuildId
    //         );
    //         celebrationData.trustedRoles = rawGuildCelebrationData.trustedRoles.filter(
    //             t => t.GuildId === rawData.GuildId
    //         );
    //         celebrationData.anniversaryRoles = rawGuildCelebrationData.anniversaryRoles.filter(
    //             ar => ar.GuildId === rawData.GuildId
    //         );
    //         dataSet.push(celebrationData);
    //     }

    //     return dataSet;
    // }
}
