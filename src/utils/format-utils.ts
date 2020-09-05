import { CustomMessages, UserDataResults } from '../models/database';
import { Guild, MessageEmbed, Util } from 'discord.js';

import moment from 'moment-timezone';

let Config = require('../../config/config.json');
const PAGE_REGEX = /Page (\d+)\/(\d+)/;
let zoneNames = moment.tz
    .names()
    .filter(name => Config.validation.regions.some(region => name.startsWith(`${region}/`)));

export abstract class FormatUtils {
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
            values.length < 2 ? '' : ' and '
        );
    }

    public static findZone(input: string): string {
        let zoneSearch = input.split(/\s+/).join('_').toLowerCase();
        return zoneNames.find(zone => zone.toLowerCase().includes(zoneSearch));
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
        pageSize: number
    ): Promise<MessageEmbed> {
        let embed = new MessageEmbed()
            .setTitle(`Birthday Messages | Page ${page}/${customMessageResults.stats.TotalPages}`)
            .setThumbnail(guild.iconURL())
            .setColor(Config.colors.default)
            .addField(
                'Actions',
                '`bday message add <message>`\n`bday message remove <position>`\n`bday message clear`'
            )
            .setFooter(
                `Total Messages: ${customMessageResults.stats.TotalItems} • ${Config.experience.birthdayListSize} per page`,
                guild.iconURL()
            )
            .setTimestamp();

        let i = (page - 1) * pageSize + 1;

        if (customMessageResults.customMessages.length === 0) {
            let embed = new MessageEmbed()
                .setDescription('**No Custom Birthday Messages!**')
                .setColor(Config.colors.default);
            return embed;
        }
        let description = `*A random birthday message is chosen for each birthday. If there are none set, it will use the default birthday message. [(?)](${Config.links.docs}/faq#what-is-a-custom-birthday-message)*\n\n`;

        for (let customMessage of customMessageResults.customMessages) {
            description += `**${i.toLocaleString()}.** ${customMessage.Message}\n\n`;
            i++;
        }
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
            .setTitle(`Birthday List | Page ${page}/${userDataResults.stats.TotalPages}`)
            .setThumbnail(guild.iconURL())
            .setColor(Config.colors.default)
            .setFooter(
                `Total Birthdays: ${userDataResults.stats.TotalItems} • ${Config.experience.birthdayListSize} per page`,
                guild.iconURL()
            )
            .setTimestamp();

        let i = (page - 1) * pageSize + 1;

        if (userDataResults.userData.length === 0) {
            let embed = new MessageEmbed()
                .setDescription('**No Birthdays in this server!**')
                .setColor(Config.colors.default);
            return embed;
        }
        let description = `*Birthdays are celebrated on the day (and __time zone__) of the birthday user. To set your birthday use \`bday set\`!*\n\n`;
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
                    `${guild.members.resolve(user.UserDiscordId)?.displayName}` || '**Unknown**'
                );
            }
            let userList = this.joinWithAnd(userNames); // Get the sub list of usernames for this date
            description += `**${birthday}**: ${userList}\n`; // Append the description
        }

        embed.setDescription(description);

        return embed;
    }

    public static extractPageNumber(input: string): number {
        let match = PAGE_REGEX.exec(input);
        return match ? parseInt(match[1]) : null;
    }
}
