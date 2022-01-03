import {
    ApplicationCommandData,
    CommandInteraction,
    DMChannel,
    Message,
    MessageEmbed,
    MessageReaction,
    PermissionString,
    User,
    Util,
} from 'discord.js';
import { Chrono, ParsedComponents, ParsedResult, en } from 'chrono-node';
import { FormatUtils, MessageUtils, PermissionUtils } from '../utils';
import { GuildRepo, UserRepo } from '../services/database/repos';
import { Lang, Logger } from '../services';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { CollectOptions } from 'discord.js-collector-utils';
import { CollectorUtils } from '../utils/collector-utils';
import { Command } from './command';
import { EventData } from '../models/internal-models';
import { GuildData } from '../models/database';
import { LangCode } from '../models/enums';
import { channel } from 'diagnostics_channel';

let Config = require('../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

const trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];
export class SetCommand implements Command {
    public metadata: ApplicationCommandData = {
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
    public requireDev = false;
    public requireGuild = false;
    public requireClientPerms: PermissionString[] = [
        'ADD_REACTIONS',
        'VIEW_CHANNEL',
        'MANAGE_MESSAGES',
        'READ_MESSAGE_HISTORY',
    ];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    constructor(public guildRepo: GuildRepo, public userRepo: UserRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let birthdayInput = intr.options.getString(Lang.getCom('arguments.date'));
        let timezoneInput = intr.options.getString(Lang.getCom('arguments.timezone'));
        let target = intr.options.getUser(Lang.getCom('arguments.user')) ?? intr.user;
        let dm = intr.channel instanceof DMChannel;
        let guildData: GuildData;

        let timeZone = timezoneInput ? FormatUtils.findZone(timezoneInput) : undefined;
        let suggest = intr.user !== target;

        if (suggest) {
            if (dm) {
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('validation', 'embeds.suggestBirthdayInDM', data.lang())
                );
                return;
            }

            if (target.bot) {
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('validation', 'embeds.cantSuggestForBot', data.lang())
                );
                return;
            }

            // Else we check if they have permission
            guildData = await this.guildRepo.getGuild(intr.guild.id);

            if (
                guildData &&
                !PermissionUtils.hasPermission(intr.guild.members.resolve(intr.user.id), guildData)
            ) {
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('validation', 'embeds.cantSuggest', LangCode.EN_US)
                );
                return;
            }
        }

        let userData = await this.userRepo.getUser(target.id);

        let changesLeft = userData ? userData?.ChangesLeft : 5;

        if (!(channel instanceof DMChannel) && !guildData)
            guildData = await this.guildRepo.getGuild(intr.guild.id);

        // if the guild has a timezone, and their inputted timezone isn't already the guild's timezone
        if (
            guildData &&
            guildData?.DefaultTimezone !== '0' &&
            (!timeZone || timeZone !== guildData?.DefaultTimezone)
        ) {
            let collectReact = CollectorUtils.createReactCollect(intr.user, async () => {
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('results', 'embeds.promptExpired', data.lang())
                );
            });
            let confirmationMessage = await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed(
                    'prompts',
                    'settingBirthday.defaultTimeZoneAvailable' + (timeZone ? 'Override' : ''),
                    LangCode.EN_US,
                    {
                        SERVER_TIMEZONE: guildData.DefaultTimezone,
                        INPUTTED_TIMEZONE: timeZone,
                        TARGET: target.username,
                    }
                )
            );
            // Send confirmation and emotes
            for (let option of trueFalseOptions) {
                await MessageUtils.react(confirmationMessage, option);
            }

            let confirmation: boolean = await collectReact(
                confirmationMessage,
                async (msgReaction: MessageReaction, reactor: User) => {
                    if (!trueFalseOptions.includes(msgReaction.emoji.name)) return;
                    return msgReaction.emoji.name === Config.emotes.confirm;
                }
            );

            // MessageUtils.delete(confirmationMessage);

            if (confirmation === undefined) return;

            if (confirmation) {
                // Confirm
                timeZone = timeZone ?? guildData.DefaultTimezone;
            } else {
                // deny
                timeZone = timeZone ? guildData.DefaultTimezone : null;
            }
        }

        let collect = CollectorUtils.createMsgCollect(intr.channel, intr.user, async () => {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('validation', 'embeds.promptExpired', data.lang())
            );
        });

        if (!timeZone) {
            let timezoneMessage = await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('prompts', 'settingBirthday.birthdaySetupTimeZone', LangCode.EN_US, {
                    TARGET: target.username,
                    AUTHOR_ICON: target.displayAvatarURL(),
                    ICON: intr.client.user.displayAvatarURL(),
                    TAG: target.tag,
                })
            );

            timeZone = await collect(async (nextMsg: Message) => {
                if (FormatUtils.checkAbbreviation(nextMsg.content)) {
                    await MessageUtils.sendIntr(
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
                    await MessageUtils.sendIntr(
                        intr,
                        Lang.getEmbed('validation', 'embeds.invalidTimezone', LangCode.EN_US, {
                            TARGET: target.username,
                            ICON: intr.client.user.displayAvatarURL(),
                        })
                    );
                    return;
                }

                return input;
            });

            // MessageUtils.delete(timezoneMessage);
        }

        if (timeZone === undefined) {
            return;
        }

        let littleEndian = !guildData ? false : guildData.DateFormat === 'month_day' ? false : true;

        let parser = new Chrono(en.createConfiguration(true, littleEndian));
        let birthday = birthdayInput
            ? FormatUtils.getBirthday(birthdayInput, parser, littleEndian)
            : undefined;

        if (!birthday) {
            let birthdayMessage = await MessageUtils.sendIntr(
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

            birthday = await collect(async (nextMsg: Message) => {
                let result = FormatUtils.getBirthday(nextMsg.content, parser, littleEndian);

                // Don't laugh at my double check it prevents the dates chrono misses on the first input
                if (!result) {
                    await MessageUtils.sendIntr(
                        intr,
                        Lang.getEmbed('validation', 'embeds.invalidBirthday', LangCode.EN_US, {
                            TARGET: target.username,
                        })
                    );
                    return;
                }

                return result;
            });
            // MessageUtils.delete(birthdayMessage);
        }

        if (birthday === undefined) {
            return;
        }

        // Re-Parse into a Chrono date to format the output variables

        let birthDate = parser.parseDate(birthday);
        let month = birthDate.getMonth() + 1;
        let day = birthDate.getDate();

        let confirmationEmbed: MessageEmbed;

        let collectReact = CollectorUtils.createReactCollect(target, async () => {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results', 'embeds.promptExpired', data.lang())
            );
        });

        confirmationEmbed = Lang.getEmbed(
            'prompts',
            'settingBirthday.confirmBirthday',
            LangCode.EN_US,
            {
                TARGET: target.toString(),
                BIRTHDAY: `${FormatUtils.getMonth(month)} ${day}`,
                TIMEZONE: timeZone,
            }
        );

        let confirmationMessage = await MessageUtils.sendIntr(intr, confirmationEmbed); // Send confirmation and emotes
        for (let option of trueFalseOptions) {
            await MessageUtils.react(confirmationMessage, option);
        }

        let confirmation: boolean = await collectReact(
            confirmationMessage,
            async (msgReaction: MessageReaction, reactor: User) => {
                if (!trueFalseOptions.includes(msgReaction.emoji.name)) return;
                return msgReaction.emoji.name === Config.emotes.confirm;
            }
        );

        // MessageUtils.delete(confirmationMessage);

        if (confirmation === undefined) return;

        if (confirmation) {
            // Confirm
            await this.userRepo.addOrUpdateUser(target.id, birthday, timeZone, changesLeft); // Add or update user

            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results', 'embeds.setBirthday', LangCode.EN_US, {
                    USER: target.toString(),
                    BIRTHDAY: `${FormatUtils.getMonth(month)} ${day}`,
                    TIMEZONE: timeZone,
                })
            );
            return;
        } else {
            // Cancel
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results', 'embeds.actionCanceled', LangCode.EN_US)
            );
            return;
        }
    }
}
