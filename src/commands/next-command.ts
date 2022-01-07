import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';
import { CelebrationUtils, MessageUtils, TimeUtils } from '../utils';

import { ApplicationCommandOptionType } from 'discord-api-types';
import moment from 'moment';
import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { UserRepo } from '../services/database/repos';
import { Command } from './command';

export class NextCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.next'),
        description: 'View the next event date. Defaults to birthday.',
        options: [
            {
                name: Lang.getCom('arguments.type'),
                description: 'What type of event to view the next of.',
                type: ApplicationCommandOptionType.String.valueOf(),
                required: false,
                choices: [
                    {
                        name: 'birthday',
                        value: 'BIRTHDAY',
                    },
                    {
                        name: 'memberAnniversary',
                        value: 'MEMBER_ANNIVERSARY',
                    },
                    {
                        name: 'serverAnniversary',
                        value: 'SERVER_ANNIVERSARY',
                    },
                ],
            },
        ],
    };
    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = true;
    public requirePremium = false;

    constructor(public userRepo: UserRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        const type = intr.options.getString(Lang.getCom('arguments.type')) ?? 'BIRTHDAY';
        let timezone = data.guild?.DefaultTimezone;
        let userList: string;
        const now = moment.tz(timezone);

        if (type !== 'BIRTHDAY' && (!timezone || timezone === '0')) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.serverTimezoneNotSet', LangCode.EN_US)
            );
            return;
        }

        switch (type) {
            case 'BIRTHDAY':
                // Next birthday
                const users = [...intr.guild.members.cache.filter(member => !member.user.bot).keys()];

                const userDatas = await this.userRepo.getAllUsers(users);

                if (!userDatas) {
                    await MessageUtils.sendIntr(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.noBirthdaysInServer',
                            LangCode.EN_US
                        )
                    );
                    return;
                }

                const commandUser = userDatas.find(user => user.UserDiscordId === intr.user.id);

                timezone =
                    timezone && timezone !== '0' && data.guild?.UseTimezone === 'server'
                        ? timezone
                        : commandUser?.TimeZone;

                const nextBirthdayUsers = CelebrationUtils.getNextUsers(userDatas, timezone);

                if (!nextBirthdayUsers) {
                    await MessageUtils.sendIntr(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.noUpcomingBirthdays',
                            LangCode.EN_US
                        )
                    );
                    return;
                }

                userList = CelebrationUtils.getUserListString(
                    data.guild,
                    nextBirthdayUsers.map(user => intr.guild.members.resolve(user.UserDiscordId))
                );
                const nextBirthday = moment(nextBirthdayUsers[0].Birthday).format('MMMM Do');

                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('results', 'success.nextBirthday', LangCode.EN_US, {
                        USERS: userList,
                        BIRTHDAY: nextBirthday,
                    })
                );
                break;
            case 'MEMBER_ANNIVERSARY':
                // TODO: fetch members?
                // Next member anniversary
                let guildMembers = intr.guild.members.cache
                    .filter(member => !member.user.bot)
                    .map(member => member);
                let closestMonthDay: string;
                const nowMonthDay = now.format('MM-DD');

                for (const member of guildMembers) {
                    const memberMonthDay = moment(member.joinedAt).format('MM-DD');

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
                    await MessageUtils.sendIntr(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.noUpcomingMemberAnniversaries',
                            LangCode.EN_US
                        )
                    );
                    return;
                }

                userList = CelebrationUtils.getUserListString(data.guild, guildMembers);

                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('results', 'success.nextMemberAnniversary', LangCode.EN_US, {
                        USERS: userList,
                        DATE: moment(closestMonthDay, 'MM-DD').format('MMMM Do'),
                    })
                );
                break;
            case 'SERVER_ANNIVERSARY':
                // Next server anniversary
                const serverCreatedAt = moment(intr.guild.createdAt).tz(timezone);
                const anniversaryFormatted = serverCreatedAt.format('MMMM Do');
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

                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('results', 'success.nextServerAnniversary', LangCode.EN_US, {
                        SERVER: intr.guild.name,
                        DATE: anniversaryFormatted,
                        YEARS: yearsOldRoundedUp.toString(),
                    })
                );
                break;
        }
    }
}
