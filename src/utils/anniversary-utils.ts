import { Guild, GuildMember } from 'discord.js';
import { GuildData, UserData } from '../models/database';

import { MathUtils } from './math-utils';
import moment from 'moment';

let Debug = require('../../config/debug.json');

let Config = require('../../config/config.json');

export class AnniversaryUtils {
    public static isMemberAnniversary(
        member: GuildMember,
        guildData: GuildData,
        userData?: UserData
    ): boolean {
        if (Debug.alwaysMemberAnniversary) {
            return true;
        }

        if ((!userData && !guildData) || (!userData.TimeZone && !guildData.DefaultTimezone))
            return false;

        let timeZone: string;

        if (guildData?.UseTimezone) {
            if (guildData.UseTimezone === 'server') {
                timeZone =
                    guildData.DefaultTimezone === '0'
                        ? userData.TimeZone
                        : guildData.DefaultTimezone;
            } else {
                timeZone =
                    userData.TimeZone === '0' ? guildData.DefaultTimezone : userData.TimeZone;
            }
        } else {
            timeZone = userData.TimeZone === '0' ? guildData.DefaultTimezone : userData.TimeZone;
        }

        let currentDate = moment().tz(timeZone);
        let joinDate = moment(member.joinedAt).tz(userData.TimeZone);

        let currentDateFormatted = currentDate.format('MM-DD');
        let joinDateFormatted = joinDate.format('MM-DD');
        if (joinDateFormatted === '02-29' && !MathUtils.isLeap(currentDate.year()))
            joinDateFormatted = '02-28';
        return currentDateFormatted === joinDateFormatted;
    }

    public static isServerAnniversary(guild: Guild, guildData: GuildData): boolean {
        if (Debug.alwaysServerAnniversary) {
            return true;
        }

        if (!guildData?.DefaultTimezone) return false;

        let currentDate = moment().tz(guildData.DefaultTimezone);
        let creationDate = moment(guild.createdAt).tz(guildData.DefaultTimezone);

        let currentDateFormatted = currentDate.format('MM-DD');
        let creationDateFormatted = creationDate.format('MM-DD');

        if (creationDateFormatted === '02-29' && !MathUtils.isLeap(currentDate.year()))
            creationDateFormatted = '02-28';
        return currentDateFormatted === creationDateFormatted;
    }
}
