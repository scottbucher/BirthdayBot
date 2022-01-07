import { Guild, Message, Role, User } from 'discord.js';
import { GuildUtils, ParseUtils } from '.';

import { Lang } from '../services';
import { LangCode } from '../models/enums';
import moment from 'moment-timezone';

let Config = require('../../config/config.json');
let Abbreviations = require('../../config/abbreviations.json');
const PAGE_REGEX = /Page (\d+)\/(\d+)/;
let zoneNames = moment.tz
    .names()
    .filter(name => Config.validation.regions.some((region: any) => name.startsWith(`${region}/`)));
export class FormatUtils {
    public static roleMention(guild: Guild, discordId: string): string {
        if (discordId === '@here') {
            return discordId;
        }

        if (discordId === guild.id) {
            return '@everyone';
        }

        return `<@&${discordId}>`;
    }

    public static channelMention(discordId: string): string {
        return `<#${discordId}>`;
    }

    public static userMention(discordId: string): string {
        return `<@!${discordId}>`;
    }

    public static joinWithAnd(values: string[]): string {
        return values.length === 2
            ? values[0] + ` ${Lang.getRef('info', 'terms.and', LangCode.EN_US)} ` + values[1]
            : [values.slice(0, -1).join(', '), values.slice(-1)[0]].join(
                  values.length < 2 ? '' : `, ${Lang.getRef('info', 'terms.and', LangCode.EN_US)} `
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
    public static getBirthday(input: string, parser: any, littleEndian: boolean): string {
        // Try and get a date from the 3rd args
        if (
            (!littleEndian &&
                (input.includes('02/29') ||
                    (input.includes('2/29') && !input.includes('12/29')))) ||
            (littleEndian && (input.includes('29/02') || input.includes('29/2'))) ||
            input
                .toLowerCase()
                .includes(
                    Lang.getRef('info', 'months.feb', LangCode.EN_US).toLowerCase() + ' 29'
                ) ||
            input
                .toLowerCase()
                .includes(
                    Lang.getRef('info', 'months.feb', LangCode.EN_US).toLowerCase().slice(0, 2) +
                        ' 29'
                ) ||
            input
                .toLowerCase()
                .includes(
                    Lang.getRef('info', 'months.feb', LangCode.EN_US).toLowerCase() + ' 29th'
                ) ||
            input
                .toLowerCase()
                .includes(
                    Lang.getRef('info', 'months.feb', LangCode.EN_US).toLowerCase().slice(0, 2) +
                        ' 29th'
                )
        )
            input = '2000-02-29';
        let results = parser.parseDate(input); // Try an parse a date

        if (!results) return null;

        let month = results.getMonth() + 1; // Get the numeric value of month
        let day = results.getDate();
        let temp = `2000-${month}-${day}`;
        let doubleCheck = parser.parseDate(temp);

        return doubleCheck ? temp : null;
    }

    public static getUser(msg: Message, input: string): User {
        return (
            msg.mentions.members.first()?.user ||
            GuildUtils.findMember(msg.guild, input)?.user ||
            null
        );
    }

    public static checkIfMonth(month: string): boolean {
        return (
            month.toLowerCase() ===
                Lang.getRef('info', 'months.jan', LangCode.EN_US).toLowerCase() ||
            month.toLowerCase() ===
                Lang.getRef('info', 'months.feb', LangCode.EN_US).toLowerCase() ||
            month.toLowerCase() ===
                Lang.getRef('info', 'months.mar', LangCode.EN_US).toLowerCase() ||
            month.toLowerCase() ===
                Lang.getRef('info', 'months.apr', LangCode.EN_US).toLowerCase() ||
            month.toLowerCase() ===
                Lang.getRef('info', 'months.may', LangCode.EN_US).toLowerCase() ||
            month.toLowerCase() ===
                Lang.getRef('info', 'months.jun', LangCode.EN_US).toLowerCase() ||
            month.toLowerCase() ===
                Lang.getRef('info', 'months.jul', LangCode.EN_US).toLowerCase() ||
            month.toLowerCase() ===
                Lang.getRef('info', 'months.aug', LangCode.EN_US).toLowerCase() ||
            month.toLowerCase() ===
                Lang.getRef('info', 'months.sep', LangCode.EN_US).toLowerCase() ||
            month.toLowerCase() ===
                Lang.getRef('info', 'months.oct', LangCode.EN_US).toLowerCase() ||
            month.toLowerCase() ===
                Lang.getRef('info', 'months.nov', LangCode.EN_US).toLowerCase() ||
            month.toLowerCase() === Lang.getRef('info', 'months.dec', LangCode.EN_US).toLowerCase()
        );
    }

    public static getMonth(month: number): string {
        switch (month) {
            case 1:
                return Lang.getRef('info', 'months.jan', LangCode.EN_US);
            case 2:
                return Lang.getRef('info', 'months.feb', LangCode.EN_US);
            case 3:
                return Lang.getRef('info', 'months.mar', LangCode.EN_US);
            case 4:
                return Lang.getRef('info', 'months.apr', LangCode.EN_US);
            case 5:
                return Lang.getRef('info', 'months.may', LangCode.EN_US);
            case 6:
                return Lang.getRef('info', 'months.jun', LangCode.EN_US);
            case 7:
                return Lang.getRef('info', 'months.jul', LangCode.EN_US);
            case 8:
                return Lang.getRef('info', 'months.aug', LangCode.EN_US);
            case 9:
                return Lang.getRef('info', 'months.sep', LangCode.EN_US);
            case 10:
                return Lang.getRef('info', 'months.oct', LangCode.EN_US);
            case 11:
                return Lang.getRef('info', 'months.nov', LangCode.EN_US);
            case 12:
                return Lang.getRef('info', 'months.dec', LangCode.EN_US);
            default:
                return Lang.getRef('info', 'months.invalid', LangCode.EN_US);
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

    public static extractPageNumber(input: string): number {
        let match = PAGE_REGEX.exec(input);
        return match ? ParseUtils.parseInt(match[1]) : null;
    }

    // THIS IS WRONG
    // ALTERNATIVES ARE SUPPOSED TO BE ARRAYS BUT LANG SYSTEM DOESN'T SUPPORT IT
    public static extractCelebrationType(type: string): string {
        switch (type) {
            case Lang.getRef('info', 'types.birthday', LangCode.EN_US).toLowerCase() ||
                Lang.getRef('info', 'types.alternatives.birthday', LangCode.EN_US).toLowerCase():
                return 'birthday';
            case Lang.getRef('info', 'types.memberAnniversary', LangCode.EN_US).toLowerCase() ||
                Lang.getRef(
                    'info',
                    'types.alternatives.memberAnniversary',
                    LangCode.EN_US
                ).toLowerCase():
                return 'memberanniversary';

            case Lang.getRef('info', 'types.serverAnniversary', LangCode.EN_US).toLowerCase() ||
                Lang.getRef(
                    'info',
                    'types.alternatives.serverAnniversary',
                    LangCode.EN_US
                ).toLowerCase():
                return 'serveranniversary';

            case Lang.getRef('info', 'types.userSpecificBirthday', LangCode.EN_US).toLowerCase() ||
                Lang.getRef(
                    'info',
                    'types.alternatives.userSpecificBirthday',
                    LangCode.EN_US
                ).toLowerCase():
                return 'userspecificbirthday';

            case Lang.getRef(
                'info',
                'types.userSpecificMemberAnniversary',
                LangCode.EN_US
            ).toLowerCase() ||
                Lang.getRef(
                    'info',
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
            case Lang.getRef('info', 'types.channel', LangCode.EN_US).toLowerCase():
                return 'channel';
            case Lang.getRef('info', 'types.birthdayRole', LangCode.EN_US).toLowerCase():
                return 'role';
            case Lang.getRef('info', 'types.birthdayMasterRole', LangCode.EN_US).toLowerCase():
                return 'birthdayMasterRole';
            case Lang.getRef('info', 'types.nameFormat', LangCode.EN_US).toLowerCase():
                return 'nameFormat';
            case Lang.getRef('info', 'types.timezone', LangCode.EN_US).toLowerCase():
                return 'timezone';
            case Lang.getRef('info', 'types.useTimezone', LangCode.EN_US).toLowerCase():
                return 'useTimezone';
            case Lang.getRef('info', 'types.trustedPreventsRole', LangCode.EN_US).toLowerCase():
                return 'trustedPreventsRole';
            case Lang.getRef('info', 'types.trustedPreventsMessage', LangCode.EN_US).toLowerCase():
                return 'trustedPreventsMessage';
            case Lang.getRef('info', 'types.requireAllTrustedRoles', LangCode.EN_US).toLowerCase():
                return 'requireAllTrustedRoles';
            case Lang.getRef('info', 'types.dateFormat', LangCode.EN_US).toLowerCase():
                return 'dateFormat';
            default:
                return null;
        }
    }

    public static extractDateFormatType(type: string): string {
        switch (type) {
            case Lang.getRef('info', 'types.monthDay', LangCode.EN_US).toLowerCase() || 'mm/dd':
                return 'month_day';
            case Lang.getRef('info', 'types.dayMonth', LangCode.EN_US).toLowerCase() || 'dd/mm':
                return 'day_month';
            default:
                return null;
        }
    }

    public static extractNameFormatType(type: string): string {
        switch (type) {
            case Lang.getRef('info', 'types.mention', LangCode.EN_US).toLowerCase():
                return 'mention';
            case Lang.getRef('info', 'types.nickname', LangCode.EN_US).toLowerCase():
                return 'nickname';
            case Lang.getRef('info', 'types.username', LangCode.EN_US).toLowerCase():
                return 'username';
            case Lang.getRef('info', 'types.tag', LangCode.EN_US).toLowerCase():
                return 'tag';
            case Lang.getRef('info', 'types.default', LangCode.EN_US).toLowerCase():
                return 'default';
            default:
                return null;
        }
    }

    public static extractMiscActionType(type: string): string {
        switch (type) {
            case Lang.getRef('info', 'types.add', LangCode.EN_US).toLowerCase():
                return 'add';
            case Lang.getRef('info', 'types.remove', LangCode.EN_US).toLowerCase():
                return 'remove';
            case Lang.getRef('info', 'types.clear', LangCode.EN_US).toLowerCase():
                return 'clear';
            case Lang.getRef('info', 'types.list', LangCode.EN_US).toLowerCase():
                return 'list';
            case Lang.getRef('info', 'types.mention', LangCode.EN_US).toLowerCase():
                return 'mention';
            case Lang.getRef('info', 'types.time', LangCode.EN_US).toLowerCase():
                return 'time';
            case Lang.getRef('info', 'types.useEmbed', LangCode.EN_US).toLowerCase():
                return 'useEmbed';
            case Lang.getRef('info', 'types.help', LangCode.EN_US).toLowerCase():
                return 'help';
            case Lang.getRef('info', 'types.setup', LangCode.EN_US).toLowerCase():
                return 'setup';
            case Lang.getRef('info', 'types.anniversary', LangCode.EN_US).toLowerCase():
                return 'anniversary';
            case Lang.getRef('info', 'types.message', LangCode.EN_US).toLowerCase():
                return 'message';
            case Lang.getRef('info', 'types.blacklist', LangCode.EN_US).toLowerCase():
                return 'blacklist';
            case Lang.getRef('info', 'types.advanced', LangCode.EN_US).toLowerCase():
                return 'advanced';
            case Lang.getRef('info', 'types.premium', LangCode.EN_US).toLowerCase():
                return 'premium';
            case Lang.getRef('info', 'types.test', LangCode.EN_US).toLowerCase():
                return 'test';
            case Lang.getRef('info', 'types.create', LangCode.EN_US).toLowerCase():
                return 'create';
            case Lang.getRef('info', 'types.user', LangCode.EN_US).toLowerCase():
                return 'user';
            case Lang.getRef('info', 'types.server', LangCode.EN_US).toLowerCase():
                return 'server';
            case Lang.getRef('info', 'types.trusted', LangCode.EN_US).toLowerCase():
                return 'trusted';
            case Lang.getRef('info', 'types.claim', LangCode.EN_US).toLowerCase():
                return 'claim';
            case Lang.getRef('info', 'types.embed', LangCode.EN_US).toLowerCase():
                return 'embed';
            case Lang.getRef('info', 'types.color', LangCode.EN_US).toLowerCase():
                return 'color';
            default:
                return null;
        }
    }

    public static getCelebrationDisplayType(type: string, plural: boolean): string {
        switch (type) {
            case 'birthday':
                return Lang.getRef(
                    'info',
                    'terms.birthdayMessage' + (plural ? 's' : ''),
                    LangCode.EN_US
                );
            case 'memberanniversary':
                return Lang.getRef(
                    'info',
                    'terms.memberAnniversaryMessage' + (plural ? 's' : ''),
                    LangCode.EN_US
                );
            case 'serveranniversary':
                return Lang.getRef(
                    'info',
                    'terms.serverAnniversaryMessage' + (plural ? 's' : ''),
                    LangCode.EN_US
                );
            case 'userspecificbirthday':
                return Lang.getRef(
                    'info',
                    'terms.userBirthdayMessage' + (plural ? 's' : ''),
                    LangCode.EN_US
                );
            case 'userspecificmemberanniversary':
                return Lang.getRef(
                    'info',
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
        let am = Lang.getRef('info', 'terms.amTime', LangCode.EN_US);
        let pm = Lang.getRef('info', 'terms.pmTime', LangCode.EN_US);
        if (time === 0) return '12:00 ' + am;
        else if (time === 12) return '12:00 ' + pm;
        else if (time < 12) return time + ':00 ' + am;
        else return time - 12 + ':00 ' + pm;
    }
}
