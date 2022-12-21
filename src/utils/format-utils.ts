import { Chrono } from 'chrono-node';
import { ApplicationCommand, Guild, Locale, Role } from 'discord.js';
import { Duration } from 'luxon'; // TODO: Missing types
import { createRequire } from 'node:module';

import { Lang } from '../services/lang.js';

const require = createRequire(import.meta.url);
let Abbreviations = require('../../config/abbreviations.json');

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

    // TODO: Replace with ApplicationCommand#toString() once discord.js #8818 is merged
    // https://github.com/discordjs/discord.js/pull/8818
    public static commandMention(command: ApplicationCommand, subParts: string[] = []): string {
        let name = [command.name, ...subParts].join(' ');
        return `</${name}:${command.id}>`;
    }

    public static duration(milliseconds: number, langCode: Locale): string {
        return Duration.fromObject(
            Object.fromEntries(
                Object.entries(
                    Duration.fromMillis(milliseconds, { locale: langCode })
                        .shiftTo(
                            'year',
                            'quarter',
                            'month',
                            'week',
                            'day',
                            'hour',
                            'minute',
                            'second'
                        )
                        .toObject()
                ).filter(([_, value]) => !!value) // Remove units that are 0
            )
        ).toHuman({ maximumFractionDigits: 0 });
    }

    public static joinWithAnd(values: string[], langCode: Locale): string {
        return values.length === 2
            ? values[0] + ` ${Lang.getRef('info', 'terms.and', langCode)} ` + values[1]
            : [values.slice(0, -1).join(', '), values.slice(-1)[0]].join(
                  values.length < 2 ? '' : `, ${Lang.getRef('info', 'terms.and', langCode)} `
              );
    }

    public static checkAbbreviation(input: string): boolean {
        return Abbreviations.abbreviations.includes(input.toUpperCase());
    }

    // TODO: take another look at this
    public static getBirthday(
        input: string,
        parser: Chrono,
        littleEndian: boolean,
        langCode: Locale
    ): string {
        // Try and get a date from the 3rd args
        if (
            (!littleEndian &&
                (input.includes('02/29') ||
                    (input.includes('2/29') && !input.includes('12/29')))) ||
            (littleEndian && (input.includes('29/02') || input.includes('29/2'))) ||
            input
                .toLowerCase()
                .includes(Lang.getRef('info', 'months.feb', langCode).toLowerCase() + ' 29') ||
            input
                .toLowerCase()
                .includes(
                    Lang.getRef('info', 'months.feb', langCode).toLowerCase().slice(0, 2) + ' 29'
                ) ||
            input
                .toLowerCase()
                .includes(Lang.getRef('info', 'months.feb', langCode).toLowerCase() + ' 29th') ||
            input
                .toLowerCase()
                .includes(
                    Lang.getRef('info', 'months.feb', langCode).toLowerCase().slice(0, 2) + ' 29th'
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

    public static getMonth(month: number, langCode: Locale): string {
        switch (month) {
            case 1:
                return Lang.getRef('info', 'months.jan', langCode);
            case 2:
                return Lang.getRef('info', 'months.feb', langCode);
            case 3:
                return Lang.getRef('info', 'months.mar', langCode);
            case 4:
                return Lang.getRef('info', 'months.apr', langCode);
            case 5:
                return Lang.getRef('info', 'months.may', langCode);
            case 6:
                return Lang.getRef('info', 'months.jun', langCode);
            case 7:
                return Lang.getRef('info', 'months.jul', langCode);
            case 8:
                return Lang.getRef('info', 'months.aug', langCode);
            case 9:
                return Lang.getRef('info', 'months.sep', langCode);
            case 10:
                return Lang.getRef('info', 'months.oct', langCode);
            case 11:
                return Lang.getRef('info', 'months.nov', langCode);
            case 12:
                return Lang.getRef('info', 'months.dec', langCode);
            default:
                return Lang.getRef('info', 'months.invalid', langCode);
        }
    }

    // THIS IS WRONG
    // ALTERNATIVES ARE SUPPOSED TO BE ARRAYS BUT LANG SYSTEM DOESN'T SUPPORT IT
    public static extractCelebrationType(type: string, langCode: Locale): string {
        switch (type) {
            case Lang.getRef('info', 'types.birthday', langCode).toLowerCase():
                return 'birthday';

            case Lang.getRef('info', 'types.memberAnniversary', langCode).toLowerCase():
            case Lang.getRef('info', 'terms.memberAnniversary', langCode).toLowerCase():
            case Lang.getRef('info', 'types.member', langCode).toLowerCase():
                return 'memberAnniversary';

            case Lang.getRef('info', 'types.serverAnniversary', langCode).toLowerCase():
            case Lang.getRef('info', 'terms.serverAnniversary', langCode).toLowerCase():
            case Lang.getRef('info', 'types.server', langCode).toLowerCase():
                return 'serverAnniversary';

            case Lang.getRef('info', 'types.userSpecificBirthday', langCode).toLowerCase():
                return 'userSpecificBirthday';

            case Lang.getRef('info', 'types.userSpecificMemberAnniversary', langCode).toLowerCase():
                return 'userSpecificMemberAnniversary';
            default:
                return null;
        }
    }

    public static extractDateFormatType(type: string, langCode: Locale): string {
        switch (type) {
            case Lang.getRef('info', 'types.monthDay', langCode).toLowerCase() || 'mm/dd':
                return 'month_day';
            case Lang.getRef('info', 'types.dayMonth', langCode).toLowerCase() || 'dd/mm':
                return 'day_month';
            default:
                return null;
        }
    }

    public static extractNameFormatType(type: string, langCode: Locale): string {
        switch (type) {
            case Lang.getRef('info', 'types.mention', langCode).toLowerCase():
                return 'mention';
            case Lang.getRef('info', 'types.nickname', langCode).toLowerCase():
                return 'nickname';
            case Lang.getRef('info', 'types.username', langCode).toLowerCase():
                return 'username';
            case Lang.getRef('info', 'types.tag', langCode).toLowerCase():
                return 'tag';
            case Lang.getRef('info', 'types.default', langCode).toLowerCase():
                return 'default';
            default:
                return null;
        }
    }

    public static extractMiscActionType(type: string, langCode: Locale): string {
        switch (type) {
            case Lang.getRef('info', 'types.add', langCode).toLowerCase():
                return 'add';
            case Lang.getRef('info', 'types.remove', langCode).toLowerCase():
                return 'remove';
            case Lang.getRef('info', 'types.clear', langCode).toLowerCase():
                return 'clear';
            case Lang.getRef('info', 'types.list', langCode).toLowerCase():
                return 'list';
            case Lang.getRef('info', 'types.mention', langCode).toLowerCase():
                return 'mention';
            case Lang.getRef('info', 'types.time', langCode).toLowerCase():
                return 'time';
            case Lang.getRef('info', 'types.useEmbed', langCode).toLowerCase():
                return 'useEmbed';
            case Lang.getRef('info', 'types.help', langCode).toLowerCase():
                return 'help';
            case Lang.getRef('info', 'types.setup', langCode).toLowerCase():
                return 'setup';
            case Lang.getRef('info', 'types.anniversary', langCode).toLowerCase():
                return 'anniversary';
            case Lang.getRef('info', 'types.message', langCode).toLowerCase():
                return 'message';
            case Lang.getRef('info', 'types.blacklist', langCode).toLowerCase():
                return 'blacklist';
            case Lang.getRef('info', 'types.advanced', langCode).toLowerCase():
                return 'advanced';
            case Lang.getRef('info', 'types.premium', langCode).toLowerCase():
                return 'premium';
            case Lang.getRef('info', 'types.test', langCode).toLowerCase():
                return 'test';
            case Lang.getRef('info', 'types.create', langCode).toLowerCase():
                return 'create';
            case Lang.getRef('info', 'types.user', langCode).toLowerCase():
                return 'user';
            case Lang.getRef('info', 'types.server', langCode).toLowerCase():
                return 'server';
            case Lang.getRef('info', 'types.trusted', langCode).toLowerCase():
                return 'trusted';
            case Lang.getRef('info', 'types.claim', langCode).toLowerCase():
                return 'claim';
            case Lang.getRef('info', 'types.embed', langCode).toLowerCase():
                return 'embed';
            case Lang.getRef('info', 'types.color', langCode).toLowerCase():
                return 'color';
            default:
                return null;
        }
    }

    public static getCelebrationDisplayType(
        type: string,
        plural: boolean,
        langCode: Locale
    ): string {
        switch (type) {
            case 'birthday':
                return Lang.getRef('info', 'terms.birthdayMessage' + (plural ? 's' : ''), langCode);
            case 'memberanniversary':
                return Lang.getRef(
                    'info',
                    'terms.memberAnniversaryMessage' + (plural ? 's' : ''),
                    langCode
                );
            case 'serveranniversary':
                return Lang.getRef(
                    'info',
                    'terms.serverAnniversaryMessage' + (plural ? 's' : ''),
                    langCode
                );
            case 'userspecificbirthday':
                return Lang.getRef(
                    'info',
                    'terms.userBirthdayMessage' + (plural ? 's' : ''),
                    langCode
                );
            case 'userspecificmemberanniversary':
                return Lang.getRef(
                    'info',
                    'terms.userMemberAnniversaryMessage' + (plural ? 's' : ''),
                    langCode
                );
            default:
                return null;
        }
    }

    /**
     * @deprecated the full ping is stored in the database so no formatting is needed
     */
    public static getMentionSetting(ping: string, guild: Guild): string {
        // Find mentioned role
        let roleInput: Role = guild.roles.resolve(ping);

        if (!roleInput || roleInput.guild.id !== guild.id) {
            if (ping?.toLowerCase() === 'everyone' || ping?.toLowerCase() === 'here') {
                return '@' + ping;
            }
        } else {
            return roleInput?.toString();
        }
        return 'none';
    }

    public static getMessageTime(time: number, langCode: Locale): string {
        let am = Lang.getRef('info', 'terms.amTime', langCode);
        let pm = Lang.getRef('info', 'terms.pmTime', langCode);
        if (time === 0) return '12:00 ' + am;
        else if (time === 12) return '12:00 ' + pm;
        else if (time < 12) return `${time}:00 ${am}`;
        else return `${time - 12}:00 ${pm}`;
    }
}
