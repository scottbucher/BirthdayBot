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

let Config = require('../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.promptExpireTime * 1000,
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
            nextMsg.content.split(/\s+/)[0].toLowerCase() === Config.prefix;
        let expireFunction: ExpireFunction = async () => {
            await channel.send(
                new MessageEmbed()
                    .setTitle('Birthday Setup - Expired')
                    .setDescription('Type `bday set` to rerun the setup.')
                    .setColor(Config.colors.error)
            );
        };
        let target: User;

        if (args.length === 3) {
            // Check if the user is trying to set another person's birthday
            if (channel instanceof DMChannel) {
                let embed = new MessageEmbed()
                    .setDescription(`You cannot request to set another user's information in a DM!\nIf you are try to setting your own, only input \`bday set\`!`)
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }

            if (!msg.member.hasPermission(Permissions.FLAGS.ADMINISTRATOR)) {
                // Only admins can set other's birthday
                let embed = new MessageEmbed()
                    .setDescription('Only admins may suggest birthdays for other users!\nIf you are try to setting your own, only input `bday set`!')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }
            // Get who they are mentioning
            let member = msg.mentions.members.first() || GuildUtils.findMember(msg.guild, args[2]);
            target =
                msg.mentions.members.first()?.user ||
                GuildUtils.findMember(msg.guild, args[2])?.user;

            // Did we find a user?
            if (!target) {
                let embed = new MessageEmbed()
                    .setDescription('Could not find that user!')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }

            if (
                member &&
                !channel.permissionsFor(member).has([Permissions.FLAGS.READ_MESSAGE_HISTORY])
            ) {
                let embed = new MessageEmbed()
                    .setDescription('That user needs the `READ_MESSAGE_HISTORY` permission in this channel!')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }
        } else {
            // They didn't mention anyone
            target = msg.author;
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
        let birthday: string;
        let timeZone: string;

        let month: number; // Get the numeric value of month
        let day: number;

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

        let timeZoneEmbed = new MessageEmbed()
            .setDescription(
                '**Please Note**: by submitting this information you agree it can be shown to anyone.' +
                    '\n' +
                    '\nFirst, please enter your time zone. [(?)](https://birthdaybot.scottbucher.dev/faq#why-does-birthday-bot-need-my-timezone)' +
                    '\n' +
                    '\nTo find your time zone please use the [map time zone picker](https://kevinnovak.github.io/Time-Zone-Picker/)!' +
                    '\n' +
                    '\nSimply click your location on the map and copy the name of the selected time zone. You can then enter it below.' +
                    '\n' +
                    '\n**Example Usage** `America/New_York`'
            )
            .setFooter(`This message expires in 2 minutes!`, msg.client.user.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp()
            .setAuthor(`${target.username}#${target.discriminator}`, target.avatarURL());

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
                        .setFooter(`Please check above and try again!`, msg.client.user.avatarURL())
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

        if (timeZone === undefined) {
            return;
        }

        let birthdayEmbed = new MessageEmbed()
            .setDescription(
                `\n\Now, please provide ${msg.client.user.toString()} with your birth month and day [(?)](https://birthdaybot.scottbucher.dev/faq#why-does-birthday-bot-only-need-my-birth-month-and-date)` +
                    '\n\n**Example Usage** `08/28` (MM/DD)'
            )
            .setFooter(`This message expires in 2 minutes!`, msg.client.user.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp()
            .setAuthor(`${target.username}#${target.discriminator}`, target.avatarURL());

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
                let results = await Chrono.parseDate(nextMsg.content); // Try an parse a date

                if (!results) {
                    let embed = new MessageEmbed()
                        .setDescription('Invalid birthday!')
                        .setFooter(`Please check above and try again!`, msg.client.user.avatarURL())
                        .setTimestamp()
                        .setColor(Config.colors.error);
                    if (suggest) embed.setTitle(`Setup For ${target.username} - Birthday`);
                    else embed.setTitle('User Setup - Birthday');
                    await channel.send(embed);
                    return;
                }

                month = results.getMonth() + 1; // Get the numeric value of month
                day = results.getDate();
                let temp = `2000-${month}-${day}`;
                let doubleCheck = await Chrono.parseDate(temp);

                // Don't laugh at my double check it prevents the dates chrono misses on the first input
                if (!doubleCheck) {
                    let embed = new MessageEmbed()
                        .setDescription('Invalid birthday!')
                        .setFooter(`Please check above and try again!`, msg.client.user.avatarURL())
                        .setTimestamp()
                        .setColor(Config.colors.error);
                    if (suggest) embed.setTitle(`Setup For ${target.username} - Birthday`);
                    else embed.setTitle('User Setup - Birthday');
                    await channel.send(embed);
                    return;
                }

                return temp;
            },
            expireFunction,
            COLLECT_OPTIONS
        );

        ActionUtils.deleteMessage(birthdayMessage);

        if (birthday === undefined) {
            return;
        }

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
