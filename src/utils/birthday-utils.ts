import { Chrono } from 'chrono-node';
import {
    ButtonInteraction,
    CommandInteraction,
    ComponentType,
    DMChannel,
    MessageComponentInteraction,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputStyle,
    User,
} from 'discord.js';
import { ExpireFunction } from 'discord.js-collector-utils';

import { UserData } from '../database/entities/user.js';
import { EventData } from '../models/internal-models.js';
import { Lang } from '../services/lang.js';
import {
    CollectorUtils,
    FormatUtils,
    InteractionUtils,
    TimeUtils,
    TimeZoneUtils,
} from './index.js';

export class BirthdayUtils {
    public static async getUserTimezone(
        target: User,
        data: EventData,
        intr: CommandInteraction,
        nextIntr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction
    ): Promise<
        [CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction, string]
    > {
        let expireFunction: ExpireFunction = async () => {
            await InteractionUtils.send(
                nextIntr,
                Lang.getEmbed('results', 'fail.promptExpired', data.lang)
            );
        };
        let timeZonePrompt = await InteractionUtils.sendWithEnterResponseButton(
            nextIntr,
            data,
            Lang.getEmbed('prompts', 'settingBirthday.birthdaySetupTimeZone', data.lang, {
                TARGET: target.username,
                AUTHOR_ICON: target.displayAvatarURL(),
                ICON: intr.client.user.displayAvatarURL(),
                TAG: target.tag,
            })
        );

        let timeZoneResult = await CollectorUtils.collectByModal(
            timeZonePrompt,
            new ModalBuilder({
                customId: 'modal', // Will be overwritten
                title: Lang.getRef('info', 'terms.timeZone', data.lang),
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.TextInput,
                                customId: 'type',
                                label: Lang.getRef('info', 'terms.timeZone', data.lang),
                                required: true,
                                style: TextInputStyle.Short,
                                minLength: 1,
                                placeholder: Lang.getRef(
                                    'info',
                                    'terms.newYorkTimezone',
                                    data.lang
                                ),
                            },
                        ],
                    },
                ],
            }),
            intr.user,
            async (intr: ModalSubmitInteraction) => {
                let textInput = intr.components[0].components[0];
                if (textInput.type !== ComponentType.TextInput) {
                    return;
                }

                if (FormatUtils.checkAbbreviation(textInput.value)) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getEmbed(
                            'validation',
                            'embeds.invalidTimeZoneAbbreviation',
                            data.lang,
                            {
                                TARGET: target.username,
                                ICON: intr.client.user.displayAvatarURL(),
                            }
                        )
                    );
                    return;
                }

                let givenTimeZone = TimeZoneUtils.find(textInput.value); // Try and get the time zone
                if (!givenTimeZone) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed('validation', 'errorEmbeds.invalidTimezone', data.lang, {
                            TARGET: target.username,
                            ICON: intr.client.user.displayAvatarURL(),
                        })
                    );
                    return;
                }

                return { intr, value: givenTimeZone };
            },
            expireFunction
        );

        if (timeZoneResult === undefined) return;

        return [timeZoneResult.intr, timeZoneResult.value.name];
    }

    public static async getUserBirthday(
        birthday: string,
        target: User,
        data: EventData,
        intr: CommandInteraction,
        nextIntr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        littleEndian: boolean,
        parser: Chrono
    ): Promise<
        [CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction, string]
    > {
        let expireFunction: ExpireFunction = async () => {
            await InteractionUtils.send(
                nextIntr,
                Lang.getEmbed('results', 'fail.promptExpired', data.lang)
            );
        };

        let birthdayPrompt = await InteractionUtils.sendWithEnterResponseButton(
            nextIntr,
            data,
            Lang.getEmbed('prompts', 'settingBirthday.birthdaySetupBirthday', data.lang, {
                TARGET: target.username,
                AUTHOR_ICON: target.displayAvatarURL(),
                ICON: intr.client.user.displayAvatarURL(),
                TAG: target.tag,
                DATE_EXAMPLE: littleEndian ? '28/08' : '08/28',
                DATE_FORMAT: littleEndian
                    ? Lang.getRef('info', 'terms.ddmm', data.lang)
                    : Lang.getRef('info', 'terms.mmdd', data.lang),
            }).setAuthor({ name: target.tag, url: target.displayAvatarURL() })
        );

        let birthdayResult = await CollectorUtils.collectByModal(
            birthdayPrompt,
            new ModalBuilder({
                customId: 'modal', // Will be overwritten
                title: Lang.getRef('info', 'terms.birthday', data.lang),
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.TextInput,
                                customId: 'type',
                                label: Lang.getRef('info', 'terms.birthday', data.lang),
                                required: true,
                                style: TextInputStyle.Short,
                                minLength: 1,
                                placeholder: Lang.getRef(
                                    'info',
                                    `terms.birthdayExample${littleEndian ? 'DM' : 'MD'}`,
                                    data.lang
                                ),
                            },
                        ],
                    },
                ],
            }),
            intr.user,
            async (intr: ModalSubmitInteraction) => {
                let textInput = intr.components[0].components[0];
                if (textInput.type !== ComponentType.TextInput) {
                    return;
                }

                let givenBirthday = FormatUtils.getBirthday(
                    textInput.value,
                    parser,
                    littleEndian,
                    data.lang
                );

                // Don't laugh at my double check it prevents the dates chrono misses on the first input
                if (!givenBirthday) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed('validation', 'errorEmbeds.invalidBirthday', data.lang, {
                            TARGET: target.username,
                        })
                    );
                    return;
                }

                return { intr, value: givenBirthday };
            },
            expireFunction
        );

        if (birthdayResult === undefined) return;

        return [birthdayResult.intr, birthdayResult.value];
    }

    public static async getUseServerDefaultTimezone(
        timeZone: string,
        target: User,
        data: EventData,
        intr: CommandInteraction,
        nextIntr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction
    ): Promise<
        [CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction, string]
    > {
        let guildData = data.guildData;
        if (!(intr.channel instanceof DMChannel) && data.guildData)
            if (
                guildData &&
                guildData.guildSettings.timeZone &&
                (!timeZone || timeZone !== data.guildData.guildSettings.timeZone)
            ) {
                // if the guild has a timezone, and their inputted timezone isn't already the guild's timezone
                let defaultTimezoneResult = await CollectorUtils.getBooleanFromButton(
                    intr,
                    data,
                    Lang.getEmbed(
                        'prompts',
                        'settingBirthday.defaultTimeZoneAvailable' + (timeZone ? 'Override' : ''),
                        data.lang,
                        {
                            SERVER_TIMEZONE: data.guildData.guildSettings.timeZone,
                            INPUTTED_TIMEZONE: timeZone,
                            TARGET: target.username,
                        }
                    )
                );

                if (defaultTimezoneResult === undefined) return;

                if (defaultTimezoneResult.value) {
                    // Confirm
                    timeZone = timeZone ?? data.guildData.guildSettings.timeZone;
                } else {
                    // deny
                    timeZone = timeZone ? data.guildData.guildSettings.timeZone : null;
                }
                nextIntr = defaultTimezoneResult.intr;
            }
        return [nextIntr, timeZone];
    }

    public static async confirmInformationAndStore(
        birthday: string,
        timeZone: string,
        target: User,
        data: EventData,
        nextIntr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        parser: Chrono,
        userData: UserData
    ): Promise<[boolean, CommandInteraction | ButtonInteraction]> {
        // Re-Parse into a Chrono date to format the output variables
        let birthDate = parser.parseDate(birthday);
        let month = birthDate.getMonth() + 1;
        let day = birthDate.getDate();

        let result = await CollectorUtils.getBooleanFromButton(
            nextIntr,
            data,
            Lang.getEmbed('prompts', 'settingBirthday.confirmBirthday', data.lang, {
                TARGET: target.toString(),
                BIRTHDAY: `${FormatUtils.getMonth(month, data.lang)} ${day}`,
                TIMEZONE: timeZone,
            }),
            target
        );

        if (result === undefined) return;
        nextIntr = result.intr;

        if (result.value) {
            // Confirmed
            userData = await data.em.upsert(UserData, {
                discordId: target.id,
                birthdayStartUTC: TimeUtils.dateToUTC(birthday, timeZone).toISO(),
                birthdayEndUTC: (userData.birthdayEndUTC = TimeUtils.dateToUTC(birthday, timeZone)
                    .plus({ days: 1 })
                    .toISO()),
                timeZone: timeZone,
            });
            await data.em.persistAndFlush(userData);

            await InteractionUtils.send(
                nextIntr,
                Lang.getEmbed('results', 'success.setBirthday', data.lang, {
                    USER: target.toString(),
                    BIRTHDAY: `${FormatUtils.getMonth(month, data.lang)} ${day}`,
                    TIMEZONE: timeZone,
                })
            );
            return;
        } else {
            // Cancel
            await InteractionUtils.send(
                nextIntr,
                Lang.getEmbed('results', 'fail.actionCanceled', data.lang)
            );
            return;
        }
    }
}
