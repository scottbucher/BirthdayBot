import { ArrayUtils, FormatUtils, TimeUtils } from '.';
import {
    CustomMessage,
    CustomMessages,
    GuildCelebrationData,
    GuildData,
    RawGuildCelebrationData,
    SplitUsers,
    UserData,
} from '../models/database';
import { Guild, GuildMember, Role } from 'discord.js';

import { Moment } from 'moment-timezone';
import moment from 'moment';

let Debug = require('../../config/debug.json');

let Config = require('../../config/config.json');

export class CelebrationUtils {
    public static getNextUsers(userDatas: UserData[], timeZone: string): UserData[] {
        let userTime = timeZone ? moment.tz(timeZone) : moment.tz();

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
                .sort(this.compareUserDatas),
            after: userDatas
                .filter(user => moment(user.Birthday).format('MM-DD') > splitTime.format('MM-DD'))
                .sort(this.compareUserDatas),
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

    public static isBirthdayToday(userData: UserData, guildData: GuildData): boolean {
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
        let birthdayFormatted = birthday.format('MM-DD');

        if (birthdayFormatted === '02-29' && !TimeUtils.isLeap(moment().year()))
            birthdayFormatted = '03-01';

        // The date is correct, now check the time
        return currentDateFormatted !== birthdayFormatted;
    }

    public static needsBirthdayRoleAdded(userData: UserData, guildData: GuildData): boolean {
        if (Debug.alwaysGiveBirthdayRole) {
            return true;
        }

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
        let currentHour = currentDate.hour();
        return currentHour === 0;
    }

    public static needsBirthdayRoleRemoved(userData: UserData, guildData: GuildData): boolean {
        if (Debug.alwaysGiveBirthdayRole) {
            return true;
        }

        // If the server doesn't have a default timezone, use the user's timezone
        // Else, since we have a server timezone, if the UseTimezone setting in the server does not prioritize the server, use the user's timezone
        // Else, use the server's default timezone
        let currentDate = moment()
            .tz(
                guildData.DefaultTimezone === '0'
                    ? userData.TimeZone
                    : guildData.UseTimezone !== 'server'
                    ? userData.TimeZone
                    : guildData.DefaultTimezone
            )
            .subtract(1, 'days');
        let currentHour = currentDate.hour();
        return currentHour === 0;
    }

    public static needsBirthdayMessage(userData: UserData, guildData: GuildData): boolean {
        if (Debug.alwaysSendBirthdayMessage) {
            return true;
        }

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
        let currentHour = currentDate.hour();
        return currentHour === guildData.BirthdayMessageTime;
    }

    public static isMemberAnniversaryMessage(
        guildMember: GuildMember,
        guildData: GuildData
    ): boolean {
        // TODO: add debug mode for member anniversary
        // if (Debug.alwaysGiveBirthdayRole) {
        //     return true;
        // }

        if (!guildMember || !guildData || !guildData.DefaultTimezone) return false;
        let currentDate = moment().tz(guildData.DefaultTimezone);
        let memberAnniversary = moment(guildMember.joinedAt);

        let currentDateFormatted = currentDate.format('MM-DD');
        let anniversaryFormatted = memberAnniversary.format('MM-DD');

        if (anniversaryFormatted === '02-29' && !TimeUtils.isLeap(moment().year()))
            anniversaryFormatted = '03-01';

        // The date is correct, now check the time
        return currentDateFormatted !== anniversaryFormatted
            ? false
            : currentDate.hour() !== guildData.MemberAnniversaryMessageTime
            ? false
            : true;
    }

    public static isServerAnniversaryMessage(guild: Guild, guildData: GuildData): boolean {
        // TODO: add debug mode for server anniversary
        // if (Debug.alwaysGiveBirthdayRole) {
        //     return true;
        // }

        if (!guild || !guildData || !guildData.DefaultTimezone) return false;
        let currentDate = moment().tz(guildData.DefaultTimezone);
        let serverAnniversary = moment(guild.createdAt);

        let currentDateFormatted = currentDate.format('MM-DD');
        let anniversaryFormatted = serverAnniversary.format('MM-DD');

        if (anniversaryFormatted === '02-29' && !TimeUtils.isLeap(moment().year()))
            anniversaryFormatted = '03-01';

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

    // Change input to just take an array of CustomMessage
    public static randomMessage(messages: CustomMessage[], hasPremium: boolean): CustomMessage {
        if (messages.length > 0) {
            if (hasPremium) {
                // Choose a random one
                return ArrayUtils.chooseRandom(messages);
            } else {
                // Only choose from the first 10
                return ArrayUtils.chooseRandom(
                    messages.slice(0, Config.validation.message.maxCount.birthday.free)
                ).Message;
            }
        } else {
            // Return null
            return null;
        }
    }

    public static async getMentionString(guildData: GuildData, guild: Guild): Promise<string> {
        // Find mentioned role
        let mentionString: string = '';

        if (
            guildData.BirthdayMentionSetting.toLowerCase() === 'everyone' ||
            guildData.BirthdayMentionSetting.toLowerCase() === 'here'
        ) {
            mentionString = '@' + guildData.BirthdayMentionSetting;
        }

        let roleInput: Role;

        // `
        if (mentionString === '') {
            try {
                roleInput = await guild.roles.fetch(guildData.BirthdayMentionSetting);
            } catch (error) {
                // No mention role
            }
            if (roleInput.guild.id !== guild.id) mentionString = '';
            else mentionString = roleInput.toString();
        }

        return mentionString;
    }

    public static getUserListString(guildData: GuildData, guildMember: GuildMember[]): string {
        // Find mentioned role
        let userList: string;
        // Format the user list based off the servers name format
        if (guildData.NameFormat === 'mention')
            userList = FormatUtils.joinWithAnd(guildMember.map(member => member.toString()));
        else if (guildData.NameFormat === 'username')
            userList = FormatUtils.joinWithAnd(guildMember.map(member => member.user.username));
        else if (guildData.NameFormat === 'nickname')
            userList = FormatUtils.joinWithAnd(guildMember.map(member => member.nickname));
        else if (guildData.NameFormat === 'tag')
            userList = FormatUtils.joinWithAnd(
                guildMember.map(member => `${member.user.username}#${member.user.discriminator}`)
            );
        return userList;
    }

    public static passesTrustedCheck(
        guildCelebrationData: GuildCelebrationData,
        trustedRoles: Role[],
        birthdayMember: GuildMember,
        trustedSetting: number
    ): boolean {
        // If it passed the trusted role(s) check
        // Default this to true if there are no trusted roles
        // If there are trusted roles and trusted DOESN'T prevent Role/Message (the trusted setting passed in) then set it to true
        let passTrustedCheck = trustedRoles.length == 0 ? true : trustedSetting ? false : true;

        //if passTrustedCheck is already true we don't have to check for trusted role(s)
        if (!passTrustedCheck) {
            if (guildCelebrationData.guildData.RequireAllTrustedRoles) {
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

    public static convertCelebrationData(
        rawGuildCelebrationData: RawGuildCelebrationData
    ): GuildCelebrationData[] {
        let dataSet: GuildCelebrationData[];

        for (let rawData of rawGuildCelebrationData.guildDatas) {
            let celebrationData = new GuildCelebrationData();
            celebrationData.guildData = rawData;
            celebrationData.customMessages = rawGuildCelebrationData.customMessages.filter(
                guild => (guild.GuildId = rawData.GuildId)
            );
            celebrationData.blacklistedMembers = rawGuildCelebrationData.blacklistedMembers.filter(
                guild => (guild.GuildId = rawData.GuildId)
            );
            celebrationData.trustedRoles = rawGuildCelebrationData.trustedRoles.filter(
                guild => (guild.GuildId = rawData.GuildId)
            );
            celebrationData.anniversaryRoles = rawGuildCelebrationData.anniversaryRoles.filter(
                guild => (guild.GuildId = rawData.GuildId)
            );
            dataSet.push(celebrationData);
        }

        return dataSet;
    }
}
