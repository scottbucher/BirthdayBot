import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';
import { DateTime } from 'luxon';

import { UserData } from '../../database/entities/user.js';
import {
    CelebrationType,
    DataValidation,
    EventDataType,
    NextCelebrationType,
    UseTimeZone,
} from '../../enums/index.js';
import { Language } from '../../models/enum-helpers/language.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { CelebrationUtils, InteractionUtils, TimeUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

export class NextCommand implements Command {
    public names = [Lang.getRef('commands', 'chatCommands.next', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireDev = false;
    public requireClientPerms: PermissionsString[] = [];
    public requireEventData: EventDataType[] = [];
    public dataValidation: DataValidation[] = [DataValidation.VOTE_RECENT];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let type: NextCelebrationType =
            (intr.options.getString(
                Lang.getRef('commands', 'arguments.type', Language.Default)
            ) as NextCelebrationType) ?? CelebrationType.BIRTHDAY;
        let guildData = data.guildData;
        let timeZone = guildData?.guildSettings.timeZone;
        let userList: string;
        let now = timeZone ? DateTime.local({ zone: timeZone }) : DateTime.now();

        if (type !== CelebrationType.BIRTHDAY && (!timeZone || timeZone === '0')) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.serverTimezoneNotSet', data.lang)
            );
            return;
        }

        switch (type) {
            case CelebrationType.BIRTHDAY: {
                // Next birthday
                let users = [...intr.guild.members.cache.filter(member => !member.user.bot).keys()];

                // Use the comma separated list of users to get the user data from MikroORM
                let userDatas = await data.em.find(UserData, { discordId: users });

                if (!userDatas) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.noBirthdaysInServer',
                            data.lang
                        )
                    );
                    return;
                }

                let commandUser = userDatas.find(user => user.discordId === intr.user.id);

                timeZone =
                    timeZone &&
                    timeZone !== '0' &&
                    guildData?.birthdaySettings.useTimeZone === UseTimeZone.SERVER
                        ? timeZone
                        : commandUser?.timeZone;

                let nextBirthdayUsers = CelebrationUtils.getNextUsers(userDatas, timeZone);

                if (!nextBirthdayUsers) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.noUpcomingBirthdays',
                            data.lang
                        )
                    );
                    return;
                }

                userList = CelebrationUtils.getUserListString(
                    data.guildData,
                    nextBirthdayUsers.map(user => intr.guild.members.resolve(user.discordId)),
                    data.lang
                );
                let nextBirthday = DateTime.fromISO(nextBirthdayUsers[0].birthdayStartUTC).toFormat(
                    'LLLL d'
                );

                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('results', 'success.nextBirthday', data.lang, {
                        USERS: userList,
                        BIRTHDAY: nextBirthday,
                    })
                );
                break;
            }
            case CelebrationType.MEMBER_ANNIVERSARY: {
                // TODO: fetch members?
                // Next member anniversary
                let guildMembers = intr.guild.members.cache
                    .filter(member => !member.user.bot)
                    .map(member => member);
                let closestMonthDay: string;
                let nowMonthDay = now.toFormat('LL-dd');

                for (let member of guildMembers) {
                    let memberMonthDay = DateTime.fromJSDate(member.joinedAt).toFormat('LL-dd');

                    if (memberMonthDay === nowMonthDay) continue;

                    // If this is the first run through
                    if (!closestMonthDay) {
                        closestMonthDay = memberMonthDay;
                        continue;
                    }

                    let memberDiff = DateTime.fromFormat(memberMonthDay, 'LL-dd').diff(
                        DateTime.fromFormat(nowMonthDay, 'LL-dd'),
                        'days'
                    ).days;
                    let closestDiff = DateTime.fromFormat(closestMonthDay, 'LL-dd').diff(
                        DateTime.fromFormat(nowMonthDay, 'LL-dd'),
                        'days'
                    ).days;

                    // Basically if the diff is negative then that date has passed this year
                    // So we need to subtract it from 365 to get days until (366 if next year is a leap year)
                    memberDiff =
                        memberDiff < 0
                            ? (TimeUtils.isLeap(now.year + 1) ? 366 : 365) + memberDiff
                            : memberDiff;
                    closestDiff =
                        closestDiff < 0
                            ? (TimeUtils.isLeap(now.year + 1) ? 366 : 365) + closestDiff
                            : closestDiff;

                    if (memberDiff < closestDiff && memberDiff !== 0)
                        closestMonthDay = memberMonthDay;
                }

                guildMembers = guildMembers.filter(
                    member =>
                        DateTime.fromJSDate(member.joinedAt).toFormat('LL-dd') ===
                            closestMonthDay &&
                        now.year - DateTime.fromJSDate(member.joinedAt).year !== 0
                );

                if (guildMembers?.length === 0) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.noUpcomingMemberAnniversaries',
                            data.lang
                        )
                    );
                    return;
                }

                userList = CelebrationUtils.getUserListString(guildData, guildMembers, data.lang);

                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('results', 'success.nextMemberAnniversary', data.lang, {
                        USERS: userList,
                        DATE: DateTime.fromFormat(closestMonthDay, 'LL-dd').toFormat('LLLL d'),
                    })
                );
                break;
            }
            case CelebrationType.SERVER_ANNIVERSARY: {
                // Next server anniversary
                let serverCreatedAt = DateTime.fromJSDate(intr.guild.createdAt, {
                    zone: guildData.guildSettings?.timeZone,
                });
                let anniversaryFormatted = serverCreatedAt.toFormat('LLLL d');
                let yearsOldRoundedUp = now.year - serverCreatedAt.year;

                // If the diff is negative that date has already passed so we need to increase the year (this is how we round up)
                // This is confusing but we are looking for the NEXT year, so if this isn't met we technically already have the next year
                // For instance, if a server was created on August 28th 2001, and we are checking the next anniversary on June 28th 2021,
                // Subtracting those years would give you 20 years, but the server is still only 19, so 20 is correct for the upcoming year
                // Likewise if it was September 1st when checking, it would be 20 years old but we need to increase it since the server is TURNING 21 next
                if (
                    DateTime.fromFormat(serverCreatedAt.toFormat('LL-dd'), 'LL-dd').diff(
                        now,
                        'days'
                    ).days < 0
                )
                    yearsOldRoundedUp++;

                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('results', 'success.nextServerAnniversary', data.lang, {
                        SERVER: intr.guild.name,
                        DATE: anniversaryFormatted,
                        YEARS: yearsOldRoundedUp.toString(),
                    })
                );
                break;
            }
            case CelebrationType.EVENT: {
                // Not implemented yet
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('validation', 'embeds.notImplemented', data.lang)
                );
                break;
            }
        }
    }
}
