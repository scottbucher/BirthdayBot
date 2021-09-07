import { CelebrationUtils, FormatUtils, MessageUtils, TimeUtils } from '../utils';
import { DMChannel, Message, TextChannel } from 'discord.js';
import { GuildRepo, UserRepo } from '../services/database/repos';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import moment from 'moment';

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

    constructor(private userRepo: UserRepo, private guildRepo: GuildRepo) {}

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
            if (
                type !== 'birthday' &&
                type !== 'memberanniversary' &&
                type !== 'serveranniversary'
            ) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.invalidNextArgs', LangCode.EN_US)
                );
                return;
            }
        }

        if (args.length === 2 || type === 'birthday') {
            // Next birthday
            let users = [...msg.guild.members.cache.filter(member => !member.user.bot).keys()];

            let userDatas = await this.userRepo.getAllUsers(users);

            if (!userDatas) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.noBirthdaysInServer', LangCode.EN_US)
                );
                return;
            }

            let commandUser = userDatas.find(user => user.UserDiscordId === msg.author.id);

            timezone =
                timezone && timezone !== '0' && guildData?.UseTimezone === 'server'
                    ? timezone
                    : commandUser?.TimeZone;

            let nextBirthdayUsers = CelebrationUtils.getNextUsers(userDatas, timezone);

            if (!nextBirthdayUsers) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.noUpcomingBirthdays', LangCode.EN_US)
                );
                return;
            }

            let userList = nextBirthdayUsers.map(user =>
                msg.guild.members.resolve(user.UserDiscordId)
            );

            let userStringList = CelebrationUtils.getUserListString(guildData, userList);
            let nextBirthday = moment(nextBirthdayUsers[0].Birthday).format('MMMM Do');

            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.nextBirthday', LangCode.EN_US, {
                    USERS: userStringList,
                    BIRTHDAY: nextBirthday,
                })
            );
        } else {
            if (!timezone || timezone === '0') {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.serverTimezoneNotSet', LangCode.EN_US)
                );
                return;
            }
            if (type === 'memberanniversary') {
                // TODO: fetch members?
                // Next member anniversary
                let guildMembers = msg.guild.members.cache
                    .filter(member => !member.user.bot)
                    .map(member => member);
                let closestMonthDay: string;
                let now = moment.tz(timezone);
                let nowMonthDay = now.format('MM-DD');

                for (let member of guildMembers) {
                    let memberMonthDay = moment(member.joinedAt).format('MM-DD');

                    if (memberMonthDay === nowMonthDay) continue;

                    // If this is the first run through
                    if (!closestMonthDay) {
                        closestMonthDay = memberMonthDay;
                        continue;
                    }

                    let memberDiff = moment(memberMonthDay, 'MM-DD').diff(
                        moment(nowMonthDay, 'MM-DD'),
                        'days'
                    );
                    let closestDiff = moment(closestMonthDay, 'MM-DD').diff(
                        moment(nowMonthDay, 'MM-DD'),
                        'days'
                    );

                    // Basically if the diff is negative then that date has passed this year
                    // So we need to subtract it from 365 to get days until (366 if next year is a leap year)
                    memberDiff =
                        memberDiff < 0
                            ? (TimeUtils.isLeap(now.year() + 1) ? 366 : 365) + memberDiff
                            : memberDiff;
                    closestDiff =
                        closestDiff < 0
                            ? (TimeUtils.isLeap(now.year() + 1) ? 366 : 365) + closestDiff
                            : closestDiff;

                    if (memberDiff < closestDiff && memberDiff !== 0)
                        closestMonthDay = memberMonthDay;
                }

                guildMembers = guildMembers.filter(
                    member =>
                        moment(member.joinedAt).format('MM-DD') === closestMonthDay &&
                        now.year() - moment(member.joinedAt).year() !== 0
                );

                if (guildMembers?.length === 0) {
                    await MessageUtils.send(
                        channel,
                        Lang.getEmbed('validation.noUpcomingMemberAnniversaries', LangCode.EN_US)
                    );
                    return;
                }

                let userList = CelebrationUtils.getUserListString(guildData, guildMembers);

                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('results.nextMemberAnniversary', LangCode.EN_US, {
                        USERS: userList,
                        DATE: moment(closestMonthDay, 'MM-DD').format('MMMM Do'),
                    })
                );
            } else {
                // Next server anniversary
                let serverCreatedAt = moment(msg.guild.createdAt).tz(timezone);
                let anniversaryFormatted = serverCreatedAt.format('MMMM Do');
                let now = moment.tz(timezone);
                let yearsOldRoundedUp = now.year() - serverCreatedAt.year();

                // If the diff is negative that date has already passed so we need to increase the year (this is how we round up)
                // This is confusing but we are looking for the NEXT year, so if this isn't met we technically already have the next year
                // For instance, if a server was created on August 28th 2001, and we are checking the next anniversary on June 28th 2021,
                // Subtracting those years would give you 20 years, but the server is still only 19, so 20 is correct for the upcoming year
                // Likewise if it was September 1st when checking, it would be 20 years old but we need to increase it since the server is TURNING 21 next
                if (
                    moment(serverCreatedAt.format('MM-DD'), 'MM-DD').diff(
                        moment(now.format('MM-DD'), 'MM-DD'),
                        'days'
                    ) < 0
                )
                    yearsOldRoundedUp++;

                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('results.nextServerAnniversary', LangCode.EN_US, {
                        SERVER: msg.guild.name,
                        DATE: anniversaryFormatted,
                        YEARS: yearsOldRoundedUp.toString(),
                    })
                );
            }
        }
    }
}
