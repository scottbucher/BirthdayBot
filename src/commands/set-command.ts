import * as Chrono from 'chrono-node';

import { ActionUtils, FormatUtils, GuildUtils } from '../utils';
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

import { Command } from './command';
import { UserRepo } from '../services/database/repos';
import { eventNames } from 'process';
import { time } from 'console';

let Config = require('../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class SetCommand implements Command {
    public name: string = 'set';
    public aliases = ['add', 'suggest'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;

    constructor(private userRepo: UserRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
                [Config.prefix, ...Config.stopCommands].includes(nextMsg.content.split(/\s+/)[0].toLowerCase());
        let expireFunction: ExpireFunction = async () => {
            await channel.send(
                new MessageEmbed()
                    .setTitle('Birthday Set - Expired')
                    .setDescription('Type `bday set` to rerun the birthday set.')
                    .setColor(Config.colors.error)
            );
        };
        let target: User;
        let birthday: string;
        let timeZone: string;
        let admin = false;

        // Check if the user is trying to set another person's birthday
        if (
            !(channel instanceof DMChannel) &&
            msg.member.hasPermission(Permissions.FLAGS.ADMINISTRATOR)
        ) {
            admin = true;
        }

        if (args.length >= 3) {
            // Check the third arg for inputs
            if (admin) {
                target = FormatUtils.getUser(msg, args[2]);
            }

            if (!target) {
                birthday = FormatUtils.getBirthday(args[2]);
            }

            if (!birthday) {
                timeZone = FormatUtils.findZone(args[2]); // Try and get the time zone
            }
        }

        if (args.length >= 4) {
            // Check the fourth arg for inputs
            if (admin && !target) {
                target = FormatUtils.getUser(msg, args[3]);
            }

            if (!birthday) {
                birthday = FormatUtils.getBirthday(args[3]);
            }

            if (!timeZone) {
                timeZone = FormatUtils.findZone(args[3]); // Try and get the time zone
            }
        }

        if (args.length >= 5) {
            // Check the fifth arg for inputs
            if (admin && !target) {
                target = FormatUtils.getUser(msg, args[4]);
            }

            if (!birthday) {
                birthday = FormatUtils.getBirthday(args[4]);
            }

            if (!timeZone) {
                timeZone = FormatUtils.findZone(args[4]); // Try and get the time zone
            }
        }

        if (!target) {
            target = msg.author;
        } else {
            // Get who they are mentioning
            let member =
                msg.mentions.members.first() ||
                GuildUtils.findMember(msg.guild, args[2]) ||
                GuildUtils.findMember(msg.guild, args[3]) ||
                GuildUtils.findMember(msg.guild, args[4]);

            if (
                member &&
                !(channel as TextChannel)
                    .permissionsFor(member)
                    .has([Permissions.FLAGS.READ_MESSAGE_HISTORY])
            ) {
                let embed = new MessageEmbed()
                    .setDescription(
                        'That user needs the `READ_MESSAGE_HISTORY` permission in this channel!'
                    )
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }
        }

        if (target.bot) {
            let embed = new MessageEmbed()
                .setDescription("You can't set a birthday for a bot!")
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        let suggest = target !== msg.author;

        let userData = await this.userRepo.getUser(target.id); // Try and get their data
        let changesLeft = 5; // Default # of changes

        if (userData) {
            // Are they in the database?
            if (userData.ChangesLeft === 0) {
                // Out of changes?
                let embed = new MessageEmbed()
                    .setDescription('You are out of birthday attempts!')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            } else {
                changesLeft = userData.ChangesLeft;
            }
        }

        if (!timeZone) {
            let timeZoneEmbed = new MessageEmbed()
                .setDescription(
                    '**Please Note**: by submitting this information you agree it can be shown to anyone.' +
                        '\n' +
                        `\nFirst, please enter your time zone. [(?)](${Config.links.docs}/faq#why-does-birthday-bot-need-my-timezone)` +
                        '\n' +
                        `\nTo find your time zone please use the [map time zone picker](${Config.links.map})!` +
                        '\n' +
                        '\nSimply click your location on the map and copy the name of the selected time zone. You can then enter it below.' +
                        '\n' +
                        '\n**Example Usage** `America/New_York`'
                )
                .setFooter(`This message expires in 2 minutes!`, msg.client.user.avatarURL())
                .setColor(Config.colors.default)
                .setTimestamp()
                .setAuthor(target.tag, target.avatarURL());

            if (suggest) timeZoneEmbed.setTitle(`Setup For ${target.username} - Time Zone`);
            else timeZoneEmbed.setTitle('User Setup - Time Zone');

            let timezoneMessage = await channel.send(timeZoneEmbed);

            timeZone = await CollectorUtils.collectByMessage(
                msg.channel,
                // Collect Filter
                (nextMsg: Message) => nextMsg.author.id === msg.author.id,
                stopFilter,
                // Retrieve Result
                async (nextMsg: Message) => {
                    let input = FormatUtils.findZone(nextMsg.content); // Try and get the time zone
                    if (!input) {
                        let embed = new MessageEmbed()
                            .setDescription('Invalid time zone!')
                            .setFooter(
                                `Please check above and try again!`,
                                msg.client.user.avatarURL()
                            )
                            .setTimestamp()
                            .setColor(Config.colors.error);
                        if (suggest) embed.setTitle(`Setup For ${target.username} - Time Zone`);
                        else embed.setTitle('User Setup - Time Zone');
                        await channel.send(embed);
                        return;
                    }

                    return input;
                },
                expireFunction,
                COLLECT_OPTIONS
            );

            ActionUtils.deleteMessage(timezoneMessage);
        }

        if (timeZone === undefined) {
            return;
        }

        if (!birthday) {
            let birthdayEmbed = new MessageEmbed()
                .setDescription(
                    `\n\Now, please provide ${msg.client.user.toString()} with your birth month and day [(?)](${
                        Config.links.docs
                    }/faq#why-does-birthday-bot-only-need-my-birth-month-and-date)` +
                        '\n\n**Example Usage** `08/28` (MM/DD)'
                )
                .setFooter(`This message expires in 2 minutes!`, msg.client.user.avatarURL())
                .setColor(Config.colors.default)
                .setTimestamp()
                .setAuthor(target.tag, target.avatarURL());

            if (suggest) birthdayEmbed.setTitle(`Setup For ${target.username} - Birthday`);
            else birthdayEmbed.setTitle('User Setup - Birthday');

            let birthdayMessage = await channel.send(birthdayEmbed);

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
                        let embed = new MessageEmbed()
                            .setDescription('Invalid birthday!')
                            .setFooter(
                                `Please check above and try again!`,
                                msg.client.user.avatarURL()
                            )
                            .setTimestamp()
                            .setColor(Config.colors.error);
                        if (suggest) embed.setTitle(`Setup For ${target.username} - Birthday`);
                        else embed.setTitle('User Setup - Birthday');
                        await channel.send(embed);
                        return;
                    }

                    return result;
                },
                expireFunction,
                COLLECT_OPTIONS
            );

            ActionUtils.deleteMessage(birthdayMessage);
        }

        if (birthday === undefined) {
            return;
        }

        // Re-Parse into a Chrono date to format the output variables
        let birthDate = Chrono.parseDate(birthday);
        let month = birthDate.getMonth() + 1;
        let day = birthDate.getDate();

        let confirmationEmbed = new MessageEmbed().setColor(Config.colors.default);

        if (suggest) {
            confirmationEmbed
                .setDescription(
                    `${target.toString()}, please confirm this information is correct: **${FormatUtils.getMonth(
                        month
                    )} ${day}, ${timeZone}**`
                )
                .setFooter(
                    `${target.username} has ${changesLeft} attempts left. By clicking confirm they will use one of them.`,
                    msg.client.user.avatarURL()
                );
        } else {
            confirmationEmbed
                .setDescription(
                    `Please confirm this information is correct: **${FormatUtils.getMonth(
                        month
                    )} ${day}, ${timeZone}**`
                )
                .setFooter(
                    `You have ${changesLeft} attempts left. By clicking confirm you will use one of them.`,
                    msg.client.user.avatarURL()
                );
        }

        let trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

        let confirmationMessage = await channel.send(confirmationEmbed); // Send confirmation and emotes
        for (let option of trueFalseOptions) {
            await confirmationMessage.react(option);
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

        ActionUtils.deleteMessage(confirmationMessage);

        if (confirmation === undefined) return;

        if (confirmation === Config.emotes.confirm) {
            // Confirm

            await this.userRepo.addOrUpdateUser(target.id, birthday, timeZone, changesLeft - 1); // Add or update user

            let embed = new MessageEmbed()
                .setDescription(
                    `Successfully set your birthday to **${FormatUtils.getMonth(
                        month
                    )} ${day}, ${timeZone}**`
                )
                .setFooter(`You now have ${changesLeft - 1} birthday attempts left.`)
                .setColor(Config.colors.success);
            await channel.send(embed);
            return;
        } else if (confirmation === Config.emotes.deny) {
            // Cancel
            let embed = new MessageEmbed()
                .setDescription('Your birthday has not been set.')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }
    }
}
