import { Chrono } from 'chrono-node';
import { ButtonInteraction, CommandInteraction, DMChannel, Message, User } from 'discord.js';

import { EventData } from '../models/internal-models.js';
import { UserRepo } from '../services/database/repos/user-repo.js';
import { Lang } from '../services/lang.js';
import { CollectorUtils, FormatUtils, InteractionUtils } from './index.js';

export class BirthdayUtils {
    public static async getUserTimezone(
        timeZone: string,
        target: User,
        data: EventData,
        intr: CommandInteraction,
        nextIntr: CommandInteraction | ButtonInteraction
    ): Promise<string> {
        let _timezoneMessage = await InteractionUtils.send(
            nextIntr,
            Lang.getEmbed('prompts', 'settingBirthday.birthdaySetupTimeZone', data.lang(), {
                TARGET: target.username,
                AUTHOR_ICON: target.displayAvatarURL(),
                ICON: intr.client.user.displayAvatarURL(),
                TAG: target.tag,
            })
        );

        timeZone = await CollectorUtils.collectByMessage(
            intr.channel,
            intr.user,
            async (nextMsg: Message) => {
                if (FormatUtils.checkAbbreviation(nextMsg.content)) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getEmbed(
                            'validation',
                            'embeds.invalidTimeZoneAbbreviation',
                            data.lang(),
                            {
                                TARGET: target.username,
                                ICON: intr.client.user.displayAvatarURL(),
                            }
                        )
                    );
                    return;
                }

                let input = FormatUtils.findZone(nextMsg.content); // Try and get the time zone
                if (!input) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.invalidTimezone',
                            data.lang(),
                            {
                                TARGET: target.username,
                                ICON: intr.client.user.displayAvatarURL(),
                            }
                        )
                    );
                    return;
                }

                return input;
            },
            async () => {
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                );
            }
        );

        return timeZone;
    }

    public static async getUserBirthday(
        birthday: string,
        target: User,
        data: EventData,
        intr: CommandInteraction,
        littleEndian: boolean,
        parser: Chrono
    ): Promise<string> {
        let _birthdayMessage = await InteractionUtils.send(
            intr,
            Lang.getEmbed('prompts', 'settingBirthday.birthdaySetupBirthday', data.lang(), {
                TARGET: target.username,
                AUTHOR_ICON: target.displayAvatarURL(),
                ICON: intr.client.user.displayAvatarURL(),
                TAG: target.tag,
                DATE_EXAMPLE: littleEndian ? '28/08' : '08/28',
                DATE_FORMAT: littleEndian
                    ? Lang.getRef('info', 'terms.ddmm', data.lang())
                    : Lang.getRef('info', 'terms.mmdd', data.lang()),
            }).setAuthor({ name: target.tag, url: target.displayAvatarURL() })
        );

        birthday = await CollectorUtils.collectByMessage(
            intr.channel,
            intr.user,
            async (nextMsg: Message) => {
                let result = FormatUtils.getBirthday(nextMsg.content, parser, littleEndian);

                // Don't laugh at my double check it prevents the dates chrono misses on the first input
                if (!result) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.invalidBirthday',
                            data.lang(),
                            {
                                TARGET: target.username,
                            }
                        )
                    );
                    return;
                }

                return result;
            },
            async () => {
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                );
            }
        );

        return birthday;
    }

    public static async getUseServerDefaultTimezone(
        timeZone: string,
        target: User,
        data: EventData,
        intr: CommandInteraction,
        nextIntr: CommandInteraction | ButtonInteraction
    ): Promise<[string, CommandInteraction | ButtonInteraction]> {
        if (!(intr.channel instanceof DMChannel) && data.guild)
            if (
                data.guild?.DefaultTimezone !== '0' &&
                (!timeZone || timeZone !== data.guild?.DefaultTimezone)
            ) {
                // if the guild has a timezone, and their inputted timezone isn't already the guild's timezone
                let defaultTimezoneResult = await CollectorUtils.getBooleanFromButton(
                    intr,
                    data,
                    Lang.getEmbed(
                        'prompts',
                        'settingBirthday.defaultTimeZoneAvailable' + (timeZone ? 'Override' : ''),
                        data.lang(),
                        {
                            SERVER_TIMEZONE: data.guild.DefaultTimezone,
                            INPUTTED_TIMEZONE: timeZone,
                            TARGET: target.username,
                        }
                    )
                );

                if (defaultTimezoneResult === undefined) return;

                if (defaultTimezoneResult.value) {
                    // Confirm
                    timeZone = timeZone ?? data.guild.DefaultTimezone;
                } else {
                    // deny
                    timeZone = timeZone ? data.guild.DefaultTimezone : null;
                }
                nextIntr = defaultTimezoneResult.intr;
            }
        return [timeZone, nextIntr];
    }

    public static async confirmInformationAndStore(
        birthday: string,
        timeZone: string,
        changesLeft: number,
        target: User,
        data: EventData,
        intr: CommandInteraction,
        parser: Chrono,
        userRepo: UserRepo
    ): Promise<[boolean, CommandInteraction | ButtonInteraction]> {
        // Re-Parse into a Chrono date to format the output variables
        let birthDate = parser.parseDate(birthday);
        let month = birthDate.getMonth() + 1;
        let day = birthDate.getDate();

        let result = await CollectorUtils.getBooleanFromButton(
            intr,
            data,
            Lang.getEmbed('prompts', 'settingBirthday.confirmBirthday', data.lang(), {
                TARGET: target.toString(),
                BIRTHDAY: `${FormatUtils.getMonth(month)} ${day}`,
                TIMEZONE: timeZone,
            }),
            target
        );

        if (result === undefined) return;

        if (result.value) {
            // Confirm
            await userRepo.addOrUpdateUser(target.id, birthday, timeZone, changesLeft); // Add or update user

            await InteractionUtils.send(
                result.intr,
                Lang.getEmbed('results', 'success.setBirthday', data.lang(), {
                    USER: target.toString(),
                    BIRTHDAY: `${FormatUtils.getMonth(month)} ${day}`,
                    TIMEZONE: timeZone,
                })
            );
            return;
        } else {
            // Cancel
            await InteractionUtils.send(
                result.intr,
                Lang.getEmbed('results', 'fail.actionCanceled', data.lang())
            );
            return;
        }
    }
}
