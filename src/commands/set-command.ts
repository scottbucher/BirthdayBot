import { Chrono, en } from 'chrono-node';
import { ApplicationCommandOptionType } from 'discord-api-types/payloads/v9';
import {
    ButtonInteraction,
    ChatInputApplicationCommandData,
    CommandInteraction,
    DMChannel,
    Message,
    PermissionString,
} from 'discord.js';

import { LangCode } from '../models/enums/index.js';
import { EventData } from '../models/index.js';
import { GuildRepo, UserRepo } from '../services/database/repos/index.js';
import { Lang } from '../services/index.js';
import { CollectorUtils } from '../utils/collector-utils.js';
import { FormatUtils, InteractionUtils, PermissionUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class SetCommand implements Command {
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('commands.set'),
        description: 'Set your birthday',
        options: [
            {
                name: Lang.getCom('arguments.date'),
                description: 'The date of the birthday you want to set.',
                type: ApplicationCommandOptionType.String.valueOf(),
                required: false,
            },
            {
                name: Lang.getCom('arguments.timezone'),
                description: 'The timezone the birthday will be celebrated in.',
                type: ApplicationCommandOptionType.String.valueOf(),
                required: false,
            },
            {
                name: Lang.getCom('arguments.user'),
                description:
                    'The user whose birthday you are sett. They will have to confirm this.',
                type: ApplicationCommandOptionType.User.valueOf(),
                required: false,
            },
        ],
    };

    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireGuild = false;
    public requireClientPerms: PermissionString[] = ['VIEW_CHANNEL'];
    public requireUserPerms: PermissionString[] = [];
    public requireRole = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    constructor(public guildRepo: GuildRepo, public userRepo: UserRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let birthdayInput = intr.options.getString(Lang.getCom('arguments.date'));
        let timezoneInput = intr.options.getString(Lang.getCom('arguments.timezone'));
        let target = intr.options.getUser(Lang.getCom('arguments.user')) ?? intr.user;
        let dm = intr.channel instanceof DMChannel;

        let timeZone = timezoneInput ? FormatUtils.findZone(timezoneInput) : undefined;
        let suggest = intr.user !== target;

        if (suggest) {
            if (dm) {
                await InteractionUtils.send(
                    intr,
                    Lang.getErrorEmbed('validation', 'errorEmbeds.suggestBirthdayInDM', data.lang())
                );
                return;
            }

            if (target.bot) {
                await InteractionUtils.send(
                    intr,
                    Lang.getErrorEmbed('validation', 'errorEmbeds.cantSuggestForBot', data.lang())
                );
                return;
            }

            if (
                data.guild &&
                !PermissionUtils.hasPermission(intr.guild.members.resolve(intr.user.id), data.guild)
            ) {
                await InteractionUtils.send(
                    intr,
                    Lang.getErrorEmbed('validation', 'errorEmbeds.cantSuggest', data.lang())
                );
                return;
            }
        }

        let userData = await this.userRepo.getUser(target.id);

        let changesLeft = userData ? userData?.ChangesLeft : 5;

        let nextIntr: CommandInteraction | ButtonInteraction = intr;

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

        if (!timeZone) {
            let _timezoneMessage = await InteractionUtils.send(
                nextIntr,
                Lang.getEmbed('prompts', 'settingBirthday.birthdaySetupTimeZone', LangCode.EN_US, {
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
                                LangCode.EN_US,
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
                                LangCode.EN_US,
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

            // MessageUtils.delete(timezoneMessage);
        }

        if (timeZone === undefined) {
            return;
        }

        let littleEndian = !data.guild
            ? false
            : data.guild.DateFormat === 'month_day'
            ? false
            : true;

        let parser = new Chrono(en.createConfiguration(true, littleEndian));
        let birthday = birthdayInput
            ? FormatUtils.getBirthday(birthdayInput, parser, littleEndian)
            : undefined;

        if (!birthday) {
            let _birthdayMessage = await InteractionUtils.send(
                intr,
                Lang.getEmbed('prompts', 'settingBirthday.birthdaySetupBirthday', LangCode.EN_US, {
                    TARGET: target.username,
                    AUTHOR_ICON: target.displayAvatarURL(),
                    ICON: intr.client.user.displayAvatarURL(),
                    TAG: target.tag,
                    DATE_EXAMPLE: littleEndian ? '28/08' : '08/28',
                    DATE_FORMAT: littleEndian
                        ? Lang.getRef('info', 'terms.ddmm', LangCode.EN_US)
                        : Lang.getRef('info', 'terms.mmdd', LangCode.EN_US),
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
                                LangCode.EN_US,
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

            // MessageUtils.delete(birthdayMessage);
        }

        if (birthday === undefined) {
            return;
        }

        // Re-Parse into a Chrono date to format the output variables

        let birthDate = parser.parseDate(birthday);
        let month = birthDate.getMonth() + 1;
        let day = birthDate.getDate();

        let result = await CollectorUtils.getBooleanFromButton(
            intr,
            data,
            Lang.getEmbed('prompts', 'settingBirthday.confirmBirthday', LangCode.EN_US, {
                TARGET: target.toString(),
                BIRTHDAY: `${FormatUtils.getMonth(month)} ${day}`,
                TIMEZONE: timeZone,
            })
        );

        if (result === undefined) return;

        if (result.value) {
            // Confirm
            await this.userRepo.addOrUpdateUser(target.id, birthday, timeZone, changesLeft); // Add or update user

            await InteractionUtils.send(
                result.intr,
                Lang.getEmbed('results', 'success.setBirthday', LangCode.EN_US, {
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
                Lang.getEmbed('results', 'fail.actionCanceled', LangCode.EN_US)
            );
            return;
        }
    }
}
