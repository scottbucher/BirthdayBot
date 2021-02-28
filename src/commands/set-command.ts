import * as Chrono from 'chrono-node';

import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import {
    DMChannel,
    Message,
    MessageEmbed,
    MessageReaction,
    Permissions,
    TextChannel,
    User,
} from 'discord.js';
import { FormatUtils, GuildUtils, MessageUtils, PermissionUtils } from '../utils';
import { GuildRepo, UserRepo } from '../services/database/repos';

import { Command } from './command';
import { GuildData } from '../models/database';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { join } from 'path';

let Config = require('../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

const trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

export class SetCommand implements Command {
    public name: string = 'set';
    public aliases = ['add', 'suggest'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    constructor(private guildRepo: GuildRepo, private userRepo: UserRepo) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            [Config.prefix, ...Config.stopCommands].includes(
                nextMsg.content.split(/\s+/)[0].toLowerCase()
            );
        let expireFunction: ExpireFunction = async () => {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.birthdayExpired', LangCode.EN_US)
            );
        };
        let target: User;
        let birthday = FormatUtils.getBirthday(args.slice(2).join(' '));
        let timeZone: string;
        let dm = channel instanceof DMChannel;
        let guildData: GuildData;

        target = msg.mentions.members?.first()?.user;

        for (let i = 2; i < args.length; i++) {
            if (!FormatUtils.checkAbbreviation(args[i]) && !timeZone)
                timeZone = FormatUtils.findZone(args[i]);
        }

        if (!target || dm) {
            target = msg.author;
        } else {
            guildData = await this.guildRepo.getGuild(msg.guild.id);

            if (guildData && !PermissionUtils.hasPermission(msg.member, guildData)) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.cantSuggest', LangCode.EN_US)
                );
                return;
            }

            // Get who they are mentioning
            let member =
                msg.mentions.members?.first() ||
                GuildUtils.findMember(msg.guild, args[2]) ||
                GuildUtils.findMember(msg.guild, args[3]) ||
                GuildUtils.findMember(msg.guild, args[4]);

            if (member.user.bot) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.cantSetTimeZoneForBot', LangCode.EN_US)
                );
                return;
            }

            if (
                member &&
                !(channel as TextChannel)
                    .permissionsFor(member)
                    .has([Permissions.FLAGS.READ_MESSAGE_HISTORY])
            ) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.memberNeedsMessageHistory', LangCode.EN_US, {
                        MEMBER: member.toString(),
                    })
                );
                return;
            }
        }
        let suggest = target !== msg.author;

        let userData = await this.userRepo.getUser(target.id); // Try and get their data
        let changesLeft = 5; // Default # of changes

        if (userData) {
            // Are they in the database?
            if (userData.ChangesLeft === 0) {
                // Out of changes?
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.outOfAttempts', LangCode.EN_US)
                );
                return;
            } else {
                changesLeft = userData.ChangesLeft;
            }
        }
        if (!(channel instanceof DMChannel) && !guildData)
            guildData = await this.guildRepo.getGuild(msg.guild.id);

        // if the guild has a timezone, and their inputted timezone isn't already the guild's timezone
        if (
            guildData?.DefaultTimezone !== '0' &&
            timeZone &&
            timeZone !== guildData?.DefaultTimezone
        ) {
            let confirmationMessage = await MessageUtils.send(
                channel,
                Lang.getEmbed('defaultTimeZoneAvailable', LangCode.EN_US, {
                    TIMEZONE: guildData.DefaultTimezone,
                    TARGET: target.username,
                }).setAuthor(target.tag, target.avatarURL())
            ); // Send confirmation and emotes
            for (let option of trueFalseOptions) {
                await MessageUtils.react(confirmationMessage, option);
            }

            let confirmation: string = await CollectorUtils.collectByReaction(
                confirmationMessage,
                // Collect Filter
                (msgReaction: MessageReaction, reactor: User) =>
                    reactor.id === msg.author.id &&
                    trueFalseOptions.includes(msgReaction.emoji.name),
                stopFilter,
                // Retrieve Result
                async (msgReaction: MessageReaction, reactor: User) => {
                    return msgReaction.emoji.name;
                },
                expireFunction,
                COLLECT_OPTIONS
            );

            MessageUtils.delete(confirmationMessage);

            if (confirmation === undefined) return;

            if (confirmation === Config.emotes.confirm) {
                // Confirm
                timeZone = guildData.DefaultTimezone;
            }
        }

        let embedChoice = userData && userData.Birthday && userData.TimeZone ? 'Change' : '';

        if (!timeZone) {
            let timezoneMessage = await MessageUtils.send(
                channel,
                Lang.getEmbed('userPrompts.birthdaySetupTimeZone' + embedChoice, LangCode.EN_US, {
                    TARGET: target.username,
                }).setAuthor(target.tag, target.avatarURL())
            );

            timeZone = await CollectorUtils.collectByMessage(
                msg.channel,
                // Collect Filter
                (nextMsg: Message) => nextMsg.author.id === msg.author.id,
                stopFilter,
                // Retrieve Result
                async (nextMsg: Message) => {
                    if (FormatUtils.checkAbbreviation(nextMsg.content)) {
                        await MessageUtils.send(
                            channel,
                            Lang.getEmbed(
                                'validation.invalidTimeZoneAbbreviation',
                                LangCode.EN_US,
                                {
                                    TARGET: target.username,
                                }
                            )
                        );
                        return;
                    }

                    let input = FormatUtils.findZone(nextMsg.content); // Try and get the time zone
                    if (!input) {
                        await MessageUtils.send(
                            channel,
                            Lang.getEmbed('validation.invalidTimezone', LangCode.EN_US, {
                                TARGET: target.username,
                            })
                        );
                        return;
                    }

                    return input;
                },
                expireFunction,
                COLLECT_OPTIONS
            );

            MessageUtils.delete(timezoneMessage);
        }

        if (timeZone === undefined) {
            return;
        }

        if (!birthday) {
            let birthdayMessage = await MessageUtils.send(
                channel,
                Lang.getEmbed('userPrompts.birthdaySetupBirthday' + embedChoice, LangCode.EN_US, {
                    TARGET: target.username,
                }).setAuthor(target.tag, target.avatarURL())
            );

            birthday = await CollectorUtils.collectByMessage(
                msg.channel,
                // Collect Filter
                (nextMsg: Message) => nextMsg.author.id === msg.author.id,
                stopFilter,
                // Retrieve Result
                async (nextMsg: Message) => {
                    let result = FormatUtils.getBirthday(nextMsg.content);

                    // Don't laugh at my double check it prevents the dates chrono misses on the first input
                    if (!result) {
                        await MessageUtils.send(
                            channel,
                            Lang.getEmbed('validation.invalidBirthday', LangCode.EN_US, {
                                TARGET: target.username,
                            })
                        );
                        return;
                    }

                    return result;
                },
                expireFunction,
                COLLECT_OPTIONS
            );

            MessageUtils.delete(birthdayMessage);
        }

        if (birthday === undefined) {
            return;
        }

        // Re-Parse into a Chrono date to format the output variables
        let birthDate = Chrono.parseDate(birthday);
        let month = birthDate.getMonth() + 1;
        let day = birthDate.getDate();

        let confirmationEmbed: MessageEmbed;

        let confirmationEmbedChoice =
            userData && userData.Birthday && userData.TimeZone
                ? 'userPrompts.confirmChangeBirthday'
                : 'userPrompts.confirmFirstBirthday';
        confirmationEmbedChoice += suggest ? 'Suggest' : '';

        confirmationEmbed = Lang.getEmbed(confirmationEmbedChoice, LangCode.EN_US, {
            TARGET: target.toString(),
            BIRTHDAY: `${FormatUtils.getMonth(month)} ${day}`,
            TIMEZONE: timeZone,
            TARGET_FOOTER: target.username,
            CHANGES_LEFT: `${changesLeft}`,
        });

        let confirmationMessage = await MessageUtils.send(channel, confirmationEmbed); // Send confirmation and emotes
        for (let option of trueFalseOptions) {
            await MessageUtils.react(confirmationMessage, option);
        }

        let confirmation: string = await CollectorUtils.collectByReaction(
            confirmationMessage,
            // Collect Filter
            (msgReaction: MessageReaction, reactor: User) =>
                reactor.id === target.id && trueFalseOptions.includes(msgReaction.emoji.name),
            stopFilter,
            // Retrieve Result
            async (msgReaction: MessageReaction, reactor: User) => {
                return msgReaction.emoji.name;
            },
            expireFunction,
            COLLECT_OPTIONS
        );

        MessageUtils.delete(confirmationMessage);

        if (confirmation === undefined) return;

        if (confirmation === Config.emotes.confirm) {
            // Confirm
            await this.userRepo.addOrUpdateUser(target.id, birthday, timeZone, changesLeft - 1); // Add or update user

            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.setBirthday', LangCode.EN_US, {
                    BIRTHDAY: `${FormatUtils.getMonth(month)} ${day}`,
                    TIMEZONE: timeZone,
                    AMOUNT: `${changesLeft - 1}`,
                })
            );
            return;
        } else if (confirmation === Config.emotes.deny) {
            // Cancel
            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.actionCanceled', LangCode.EN_US)
            );
            return;
        }
    }
}
