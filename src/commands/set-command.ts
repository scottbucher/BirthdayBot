import * as Chrono from 'chrono-node';
import {
    DMChannel,
    Message,
    MessageEmbed,
    MessageReaction,
    Permissions,
    TextChannel,
    User,
} from 'discord.js';

import { UserRepo } from '../services/database/repos';
import { ActionUtils, FormatUtils, PermissionUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');

export class SetCommand implements Command {
    public name: string = 'set';
    public aliases = ['add', 'suggest'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;

    constructor(private userRepo: UserRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
        let target: User;

        if (args.length === 3) {
            // Check if the user is trying to set another person's birthday
            if (channel instanceof DMChannel) {
                let embed = new MessageEmbed()
                    .setDescription(`You cannot request to set another user's information in a DM!`)
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }

            if (!msg.member.hasPermission(Permissions.FLAGS.ADMINISTRATOR)) {
                // Only admins can set other's birthday
                let embed = new MessageEmbed()
                    .setDescription('Only admins may suggest birthdays for other users!')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }
            // Get who they are mentioning
            target =
                msg.mentions.members.first()?.user ||
                msg.guild.members.cache.find(
                    member =>
                        member.displayName.toLowerCase().includes(args[2].toLowerCase()) ||
                        member.user.username.toLowerCase().includes(args[2].toLowerCase())
                )?.user;

            // Did we find a user?
            if (!target) {
                let embed = new MessageEmbed()
                    .setDescription('Could not find that user!')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }
        } else {
            // They didn't mention anyone
            target = msg.author;
        }

        let suggest = target === msg.author;

        let userData = await this.userRepo.getUser(target.id); // Try and get their data
        let changesLeft = 5; // Default # of changes
        let birthday: string;
        let timezone: string;

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
                    '\n\nFirst, please select your time zone. [(?)](https://birthdaybot.scottbucher.dev/faq#why-does-birthday-bot-need-my-timezone)' +
                    '\n\nTo find your time zone please use the map [here](https://kevinnovak.github.io/Time-Zone-Picker/).' +
                    '\n\n**Example Usage** `America/New_York`'
            )
            .setFooter(`This message expires in 2 minutes!`, msg.client.user.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp()
            .setAuthor(`${target.username}#${target.discriminator}`, target.avatarURL());

        if (suggest) timeZoneEmbed.setTitle('User Setup - Time Zone Selection');
        else timeZoneEmbed.setTitle(`Setup For ${target.username} - Time Zone Selection`);

        await channel.send(timeZoneEmbed);

        let collector = channel.createMessageCollector(
            (nextMsg: Message) => nextMsg.author.id === msg.author.id,
            { time: Config.promptExpireTime * 1000 }
        );

        collector.on('collect', async (nextMsg: Message) => {
            // Check if bot has permission to send a message
            if (!PermissionUtils.canSend(channel)) {
                collector.stop();
                return;
            }

            // Check if another command was ran, if so cancel the current process
            let nextMsgArgs = nextMsg.content.split(' ');
            if (nextMsgArgs[0]?.toLowerCase() === 'bday') {
                collector.stop();
                return;
            }

            if (!timezone) {
                let timeZoneInput = FormatUtils.findZone(nextMsg.content); // Try and get the timezone
                if (!timeZoneInput) {
                    let embed = new MessageEmbed()
                        .setDescription('Invalid time zone!')
                        .setFooter(`Please check above and try again!`, msg.client.user.avatarURL())
                        .setTimestamp()
                        .setColor(Config.colors.error);
                    if (suggest) embed.setTitle('User Setup - Time Zone Selection');
                    else embed.setTitle(`Setup For ${target.username} - Time Zone Selection`);
                    await channel.send(embed);
                    return;
                }

                timezone = timeZoneInput;

                collector.resetTimer(); // Reset timer

                let birthdayEmbed = new MessageEmbed()
                    .setDescription(
                        `\n\Now, please provide ${msg.client.user.toString()} with your birth month and day [(?)](https://birthdaybot.scottbucher.dev/faq#why-does-birthday-bot-only-need-my-birth-month-and-date)` +
                            '\n\n**Example Usage** `08/28` (MM/DD)'
                    )
                    .setFooter(`This message expires in 2 minutes!`, msg.client.user.avatarURL())
                    .setColor(Config.colors.default)
                    .setTimestamp()
                    .setAuthor(`${target.username}#${target.discriminator}`, target.avatarURL());

                if (suggest) birthdayEmbed.setTitle('User Setup - Birthday');
                else birthdayEmbed.setTitle(`Setup For ${target.username} - Birthday`);

                await channel.send(birthdayEmbed);
                return;
            }

            if (!birthday) {
                let results = await Chrono.parseDate(nextMsg.content); // Try an parse a date

                if (!results) {
                    let embed = new MessageEmbed()
                        .setDescription('Invalid birthday!')
                        .setFooter(`Please check above and try again!`, msg.client.user.avatarURL())
                        .setTimestamp()
                        .setColor(Config.colors.error);
                    if (suggest) embed.setTitle('User Setup - Birthday');
                    else embed.setTitle(`Setup For ${target.username} - Birthday`);
                    await channel.send(embed);
                    return;
                }

                let month = results.getMonth() + 1; // Get the numeric value of month
                let day = results.getDate();
                birthday = `2000-${month}-${day}`;

                let confirmationEmbed = new MessageEmbed().setColor(Config.colors.default);

                if (!suggest) {
                    // So suggest is if it is a suggestion setup or not, (THIS IS INVERTED but it works idk why)
                    confirmationEmbed
                        .setDescription(
                            `${target.toString()}, please confirm this information is correct: **${FormatUtils.getMonth(
                                month
                            )} ${day}, ${timezone}**`
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
                            )} ${day}, ${timezone}**`
                        )
                        .setFooter(
                            `You have ${changesLeft} attempts left. By clicking confirm you will use one of them.`,
                            msg.client.user.avatarURL()
                        );
                }

                let confirmationMsg = await channel.send(confirmationEmbed); // Send confirmation and emotes
                await confirmationMsg.react(Config.emotes.confirm);
                await confirmationMsg.react(Config.emotes.deny);

                collector.stop(); // Stop the message Collector (maybe rename collector to messageCollector)

                const filter = (nextReaction: MessageReaction, reactor: User) =>
                    (nextReaction.emoji.name === Config.emotes.confirm ||
                        nextReaction.emoji.name === Config.emotes.deny) &&
                    nextReaction.users.resolve(msg.client.user.id) !== null &&
                    reactor === target; // Reaction Collector Filter

                let reactionCollector = confirmationMsg.createReactionCollector(filter, {
                    time: Config.promptExpireTime * 1000,
                });

                reactionCollector.on(
                    'collect',
                    async (nextReaction: MessageReaction, reactor: User) => {
                        // Start Reaction Collector
                        // Check if bot has permission to send a message
                        if (!PermissionUtils.canSend(channel)) {
                            reactionCollector.stop();
                            return;
                        }

                        await ActionUtils.deleteMessage(confirmationMsg); // Try and delete the message

                        if (nextReaction.emoji.name === Config.emotes.confirm) {
                            // Confirm

                            await this.userRepo.addOrUpdateUser(
                                target.id,
                                birthday,
                                timezone,
                                changesLeft - 1
                            ); // Add or update user

                            let embed = new MessageEmbed()
                                .setDescription(
                                    `Successfully set your birthday to **${FormatUtils.getMonth(
                                        month
                                    )} ${day}, ${timezone}**`
                                )
                                .setFooter(
                                    `You now have ${changesLeft - 1} birthday attempts left.`
                                )
                                .setColor(Config.colors.success);
                            await channel.send(embed);
                            return;
                        } else if (nextReaction.emoji.name === Config.emotes.deny) {
                            // Cancel
                            let embed = new MessageEmbed()
                                .setDescription('Your birthday has not been set.')
                                .setColor(Config.colors.error);
                            await channel.send(embed);
                            return;
                        }
                    }
                );
            }
        });
    }
}
