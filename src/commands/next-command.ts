import { CelebrationUtils, FormatUtils, MessageUtils, TimeUtils } from '../utils';
import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { UserRepo, GuildRepo } from '../services/database/repos';
import moment, { Moment } from 'moment';

let Config = require('../../config/config.json');

export class NextCommand implements Command {
    public name: string = 'next';
    public aliases = ['upcoming'];
    public requireSetup = false;
    public guildOnly = true;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = true;
    public requirePremium = false;
    public getPremium = false;

    constructor(private userRepo: UserRepo, private guildRepo: GuildRepo) { }

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {
        let guildData = await this.guildRepo.getGuild(msg.guild.id);
        let timezone = guildData?.DefaultTimezone;

        let type: string;

        if (args.length > 2) {
            type = FormatUtils.extractCelebrationType(args[2].toLowerCase())?.toLowerCase() ?? '';
            if (type !== 'birthday' && type !== 'memberanniversary' && type !== 'serveranniersary') {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.invalidNextArgs', LangCode.EN_US)
                );
                return;
            }
        }

        if (args.length === 2 || type === 'birthday') {
            // Next birthday
            let users = msg.guild.members.cache.filter(member => !member.user.bot).keyArray();

            let userDatas = await this.userRepo.getAllUsers(users);

            if (!userDatas) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.noBirthdaysInServer', LangCode.EN_US)
                );
                return;
            }


            let commandUser = userDatas.find(user => user.UserDiscordId === msg.author.id);

            timezone = timezone && timezone !== '0' && guildData?.UseTimezone === 'server' ? timezone : commandUser?.TimeZone;

            let nextBirthdayUsers = CelebrationUtils.getNextUsers(userDatas, timezone);

            if (!nextBirthdayUsers) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.noUpcomingBirthdays', LangCode.EN_US)
                );
                return;
            }

            let userList = nextBirthdayUsers.map(user => msg.guild.members.resolve(user.UserDiscordId));

            let userStringList = FormatUtils.joinWithAnd(userList.map(user => user.toString()));
            let nextBirthday = moment(nextBirthdayUsers[0].Birthday).format('MMMM Do');

            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.nextBirthday', LangCode.EN_US, {
                    USERS: userStringList,
                    BIRTHDAY: nextBirthday,
                })
            );
        } else {
            if (type === 'memberanniversary') {
                // TODO: fetch members?
                // Next member anniversary
                let guildMembers = msg.guild.members.cache.filter(member => !member.user.bot).map(member => member);
                let closestMonthDay: string;
                let now = timezone ? moment.tz(timezone) : moment.tz();
                let nowMonthDay = now.format('MM-DD');

                for (let member of guildMembers) {
                    let memberMonthDay = moment(member.joinedAt).format('MM-DD');

                    // If this is the first run through
                    if (!closestMonthDay) {
                        closestMonthDay = memberMonthDay;
                        continue;
                    }

                    let memberDiff = moment(nowMonthDay).diff(moment(memberMonthDay), 'days');
                    let closestDiff = moment(nowMonthDay).diff(moment(closestMonthDay), 'days');

                    // Basically if the diff is negative then that date has passed this year
                    // So we need to subtract it from 365 to get days until (366 if next year is a leap year)
                    memberDiff = memberDiff < 0 ? (TimeUtils.isLeap(now.year() + 1) ? 366 : 365) - memberDiff : memberDiff;
                    closestDiff = closestDiff < 0 ? (TimeUtils.isLeap(now.year() + 1) ? 366 : 365) - closestDiff : closestDiff;

                    if (memberDiff < closestDiff)
                        closestMonthDay = memberMonthDay;
                }

                guildMembers = guildMembers.filter(member => moment(member.joinedAt).format('MM-DD') === closestMonthDay);

                let userList = FormatUtils.joinWithAnd(guildMembers.map(member => member.toString()));


                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('results.nextMemberAnniversary', LangCode.EN_US, {
                        USERS: userList,
                        DATE: moment(closestMonthDay).format('MMMM Do')
                    })
                );


            } else {
                // Next server anniversary
                let serverCreatedAt = moment(msg.guild.createdAt).tz(timezone);
                let anniversaryFormatted = serverCreatedAt.format('MMMM Do');
                let now = timezone ? moment.tz(timezone) : moment.tz();
                let yearsOldRoundedUp = now.year() - serverCreatedAt.year();

                // If the diff is negative that date has already passed so we need to increase the year (this is how we round up)
                if (moment(now.format('MM-DD')).diff(moment(serverCreatedAt.format('MM-DD')), 'days') < 0) yearsOldRoundedUp++;


                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('results.nextServerAnniversary', LangCode.EN_US, {
                        SERVER: msg.guild.name,
                        DATE: anniversaryFormatted,
                        YEAR: yearsOldRoundedUp.toString()
                    })
                );

            }
        }
    }
}
