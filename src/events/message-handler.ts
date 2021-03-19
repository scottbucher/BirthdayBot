import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';
import { GuildRepo, UserRepo } from '../services/database/repos';
import { Logger, SubscriptionService } from '../services';
import { MessageUtils, PermissionUtils } from '../utils';

import { Command } from '../commands';
import { PlanName } from '../models/subscription-models';
import { RateLimiter } from 'discord.js-rate-limiter';
import moment from 'moment';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class MessageHandler {
    private rateLimiter = new RateLimiter(
        Config.rateLimiting.commands.amount,
        Config.rateLimiting.commands.interval * 1000
    );

    constructor(
        private helpCommand: Command,
        private commands: Command[],
        private subscriptionService: SubscriptionService,
        private guildRepo: GuildRepo,
        private userRepo: UserRepo
    ) {}

    public async process(msg: Message): Promise<void> {
        // Don't respond to partial messages, system messages, or bots
        if (msg.partial || msg.system || msg.author.bot) return;

        let channel = msg.channel;

        // await MessageUtils.send(
        //     channel,
        //     `${msg.author.username}'s joinedAt is: \`${msg.member.joinedAt}\` and their joinedTimestamp is: \`${msg.member.joinedTimestamp}\``
        // );

        // Only handle messages from text or DM channels
        if (!(channel instanceof TextChannel || channel instanceof DMChannel)) return;

        if (channel instanceof TextChannel) {
            if (!PermissionUtils.canSend(channel)) {
                // We can't even send a message to this guild
                return;
            }
            if (!PermissionUtils.canReact(channel)) {
                let embed = new MessageEmbed()
                    .setTitle('Missing Permissions!')
                    .setDescription(
                        'I need permission to **Add Reactions** & **Read Message History**!'
                    )
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }
        }

        // Check if first argument is prefix or bot mention
        let args = msg.content.split(/\s+/);
        if (
            ![Config.prefix, `<@${msg.client.user.id}>`, `<@!${msg.client.user.id}>`].includes(
                args[0].toLowerCase()
            )
        ) {
            return;
        }

        // Check if user is rate limited
        let limited = this.rateLimiter.take(msg.author.id);
        if (limited) {
            return;
        }

        // Process the command
        await this.processCommand(args, msg, channel as TextChannel | DMChannel);
    }

    private async processCommand(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {
        // If only a prefix, run the help command
        if (args.length === 1) {
            await this.helpCommand.execute(args, msg, channel);
            return;
        }

        // Try to find the command the user wants
        let command = this.findCommand(args[1]);

        // If no command found, run the help command
        if (!command) {
            await this.helpCommand.execute(args, msg, channel);
            return;
        }

        // Check if the command is a bot owner only command
        let sentByOwner = Config.support.owners.includes(msg.author.id);
        if (command.ownerOnly) {
            if (!sentByOwner) {
                if (!(channel instanceof DMChannel)) {
                    let sentByStaff =
                        Config.support.server === msg.guild.id &&
                        msg.member.roles.cache.has(Config.support.role);

                    if (!sentByStaff) {
                        let embed = new MessageEmbed()
                            .setDescription('This command can only be used by Birthday Bot staff!')
                            .setColor(Config.colors.error);

                        await MessageUtils.send(channel, embed);
                        return;
                    }
                }
            }
        }

        // Check if the command is a server only command
        if (command.guildOnly && channel instanceof DMChannel) {
            let embed = new MessageEmbed()
                .setDescription('This command can only be used in a discord server!')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        let checkVote = Config.voting.enabled && command.voteOnly;
        let checkPremium = Config.payments.enabled && command.requirePremium;

        // Get premium status if needed
        let retrievePremium =
            Config.payments.enabled && (checkVote || command.requirePremium || command.getPremium);
        let hasPremium =
            !Config.payments.enabled ||
            (retrievePremium
                ? await this.subscriptionService.hasService(PlanName.premium1, msg.guild.id)
                : false);

        if (checkPremium && !hasPremium) {
            let embed = new MessageEmbed()
                .setTitle('Premium Required!')
                .setDescription('This command requires this server to have premium!')
                .addField(
                    `Premium Commands`,
                    'Subscribe to **Birthday bot Premium** for access to our premium features.\nSee `bday premium` for more information.'
                )
                .setFooter(
                    'Premium helps us support and maintain the bot!',
                    msg.client.user.avatarURL()
                )
                .setTimestamp()
                .setColor(Config.colors.default);
            await MessageUtils.send(channel, embed);
            return;
        }

        if (checkVote && !hasPremium) {
            // Get the user's last vote and check if the command requires a vote
            let userVote = await this.userRepo.getUserVote(msg.author.id);
            let voteTime = moment(userVote?.VoteTime);
            let voteTimeAgo = userVote ? voteTime.fromNow() : 'Never';

            if (!userVote || voteTime.clone().add(Config.voting.hours, 'hours') < moment()) {
                let embed = new MessageEmbed()
                    .setAuthor(msg.author.tag, msg.author.avatarURL())
                    .setThumbnail('https://i.imgur.com/wak8g4V.png')
                    .setTitle('Vote Required!')
                    .setDescription('This command requires you to have voted in the past 24 hours!')
                    .addField('Last Vote', `${voteTimeAgo}`, true)
                    .addField('Vote Here', `[Top.gg](${Config.links.vote})`, true)
                    .setFooter(
                        `Don't want to vote? Try Birthday Bot Premium!`,
                        msg.client.user.avatarURL()
                    )
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }
        }

        try {
            // Check if command requires guild setup
            if (channel instanceof TextChannel) {
                let guildData = await this.guildRepo.getGuild(msg.guild.id);
                if (command.requireSetup && !guildData) {
                    let embed = new MessageEmbed()
                        .setTitle('Server Setup Required!')
                        .setDescription(
                            `Please run server setup with \`bday setup\` before using that command!`
                        )
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                }

                // Check if user has permission
                if (!PermissionUtils.hasPermission(msg.member, guildData, command)) {
                    let embed = new MessageEmbed()
                        .setTitle('Permission Required!')
                        .setDescription(`You don't have permission to run that command!`)
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                }
            }

            // Execute the command
            await command.execute(args, msg, channel, hasPremium);
        } catch (error) {
            // Try to notify sender of command error
            try {
                await MessageUtils.send(
                    channel,
                    new MessageEmbed()
                        .setDescription(`Something went wrong!`)
                        .addField('Error code', msg.id)
                        .addField('Contact support', Config.links.support)
                        .setColor(Config.colors.error)
                );
            } catch {
                // Ignore
            }

            // Log command error
            if (msg.channel instanceof DMChannel) {
                Logger.error(
                    Logs.error.commandDm
                        .replace('{MESSAGE_ID}', msg.id)
                        .replace('{COMMAND_NAME}', command.name)
                        .replace('{SENDER_TAG}', msg.author.tag)
                        .replace('{SENDER_ID}', msg.author.id),
                    error
                );
            } else if (msg.channel instanceof TextChannel) {
                Logger.error(
                    Logs.error.commandGuild
                        .replace('{MESSAGE_ID}', msg.id)
                        .replace('{COMMAND_NAME}', command.name)
                        .replace('{SENDER_TAG}', msg.author.tag)
                        .replace('{SENDER_ID}', msg.author.id)
                        .replace('{CHANNEL_NAME}', msg.channel.name)
                        .replace('{CHANNEL_ID}', msg.channel.id)
                        .replace('{GUILD_NAME}', msg.guild.name)
                        .replace('{GUILD_ID}', msg.guild.id),
                    error
                );
            }
        }
    }

    private findCommand(input: string): Command {
        input = input.toLowerCase();
        return (
            this.commands.find(command => command.name === input) ??
            this.commands.find(command => command.aliases.includes(input))
        );
    }
}
