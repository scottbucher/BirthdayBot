import {
    ApplicationCommandOptionType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import { CommandInteraction, PermissionString } from 'discord.js';
import moment from 'moment';

import { EventData } from '../models/index.js';
import { UserRepo } from '../services/database/repos/index.js';
import { Lang } from '../services/index.js';
import { CelebrationUtils, InteractionUtils, TimeUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class NextCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.next'),
        description: 'View the next event date. Defaults to birthday.',
        dm_permission: false,
        default_member_permissions: undefined,
        options: [
            {
                name: Lang.getCom('arguments.type'),
                description: 'What type of event to view the next of.',
                type: ApplicationCommandOptionType.String.valueOf(),
                required: false,
                choices: [
                    {
                        name: 'birthday',
                        value: 'birthday',
                    },
                    {
                        name: 'memberAnniversary',
                        value: 'member_anniversary',
                    },
                    {
                        name: 'serverAnniversary',
                        value: 'server_anniversary',
                    },
                ],
            },
        ],
    };
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = true;
    public requirePremium = false;

    constructor(public userRepo: UserRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let type = intr.options.getString(Lang.getCom('arguments.type')) ?? 'birthday';
        let timezone = data.guild?.DefaultTimezone;
        let userList: string;
        let now = timezone ? moment.tz(timezone) : moment();

        if (type !== 'birthday' && (!timezone || timezone === '0')) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.serverTimezoneNotSet', data.lang())
            );
            return;
        }

        switch (type) {
            case 'birthday': {
                // Next birthday
                let users = [...intr.guild.members.cache.filter(member => !member.user.bot).keys()];

                let userDatas = await this.userRepo.getAllUsers(users);

                if (!userDatas) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.noBirthdaysInServer',
                            data.lang()
                        )
                    );
                    return;
                }

                let commandUser = userDatas.find(user => user.UserDiscordId === intr.user.id);

                timezone =
                    timezone && timezone !== '0' && data.guild?.UseTimezone === 'server'
                        ? timezone
                        : commandUser?.TimeZone;

                let nextBirthdayUsers = CelebrationUtils.getNextUsers(userDatas, timezone);

                if (!nextBirthdayUsers) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.noUpcomingBirthdays',
                            data.lang()
                        )
                    );
                    return;
                }

                userList = CelebrationUtils.getUserListString(
                    data.guild,
                    nextBirthdayUsers.map(user => intr.guild.members.resolve(user.UserDiscordId))
                );
                let nextBirthday = moment(nextBirthdayUsers[0].Birthday).format('MMMM Do');

                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('results', 'success.nextBirthday', data.lang(), {
                        USERS: userList,
                        BIRTHDAY: nextBirthday,
                    })
                );
                break;
            }
            case 'member_anniversary': {
                // TODO: fetch members?
                // Next member anniversary
                let guildMembers = intr.guild.members.cache
                    .filter(member => !member.user.bot)
                    .map(member => member);
                let closestMonthDay: string;
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
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.noUpcomingMemberAnniversaries',
                            data.lang()
                        )
                    );
                    return;
                }

                userList = CelebrationUtils.getUserListString(data.guild, guildMembers);

                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('results', 'success.nextMemberAnniversary', data.lang(), {
                        USERS: userList,
                        DATE: moment(closestMonthDay, 'MM-DD').format('MMMM Do'),
                    })
                );
                break;
            }
            case 'server_anniversary': {
                // Next server anniversary
                let serverCreatedAt = moment(intr.guild.createdAt).tz(timezone);
                let anniversaryFormatted = serverCreatedAt.format('MMMM Do');
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

                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('results', 'success.nextServerAnniversary', data.lang(), {
                        SERVER: intr.guild.name,
                        DATE: anniversaryFormatted,
                        YEARS: yearsOldRoundedUp.toString(),
                    })
                );
                break;
            }
        }
    }
}
