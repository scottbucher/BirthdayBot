import {
    DMChannel,
    GuildMember,
    Message,
    MessageEmbed,
    Permissions,
    TextChannel,
} from 'discord.js';
import { GuildRepo, UserRepo } from '../services/database/repos';
import { Logger, SubscriptionService } from '../services';
import { MessageUtils, PermissionUtils } from '../utils';

import { Command } from '../commands';
import { GuildData } from '../models/database';
import { PlanName } from '../models/subscription-models';
import moment from 'moment';

let Config = require('../../config/config.json');
let RateLimiter = require('limiter').RateLimiter;
let limiters = {};

export class MessageHandler {
    constructor(
        private helpCommand: Command,
        private commands: Command[],
        private subscriptionService: SubscriptionService,
        private guildRepo: GuildRepo,
        private userRepo: UserRepo
    ) {}

    public async process(msg: Message): Promise<void> {
        if (msg.partial) return;

        // Ignore bots & System messages
        if (msg.author.bot || msg.system) return;

        let channel = msg.channel;

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

        // Try to get existing limiter
        let limiter = limiters[msg.author.id];

        // Create new limiter if one doesn't exist
        if (!limiter) {
            limiter = new RateLimiter(10, 30000);
            limiters[msg.author.id] = limiter;
        }

        // Get remaining tokens
        if (limiters[msg.author.id].getTokensRemaining() < 1) return;

        // Remove a token if they have one to lose
        limiters[msg.author.id].removeTokens(1, (error: any) => {
            if (error) return;
        });

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
        let userCommand = args[1];
        let command = this.getCommand(userCommand);

        // If no command found, run the help command
        if (!command) {
            await this.helpCommand.execute(args, msg, channel);
            return;
        }

        // Check if the command is a bot owner only command
        let sentByOwner = Config.owners.includes(msg.author.id);
        if (command.ownerOnly) {
            if (!sentByOwner) {
                if (!(channel instanceof DMChannel)) {
                    let sentByStaff =
                        Config.supportServerId === msg.guild.id &&
                        msg.member.roles.cache.has(Config.supportRoleId);

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
        let checkPremium = Config.premium.enabled && command.requirePremium;

        // Get premium status if needed
        let retrievePremium =
            Config.payments.enabled && (checkVote || command.requirePremium || command.getPremium);
        let hasPremium = retrievePremium
            ? await this.subscriptionService.hasService(PlanName.premium1, msg.guild.id)
            : false;

        if (checkPremium && !hasPremium) {
            let embed = new MessageEmbed()
                .setAuthor(msg.guild.name, msg.guild.iconURL())
                .setTitle('Premium Required!')
                .setDescription('This command requires this server to have premium!')
                .addField(
                    `Premium Commands`,
                    'Subscribe to Birthday bot Premium for access to our premium features.\nSee `bday premium` for more information.'
                )
                .setColor(Config.colors.error);
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
                        'Don\'t want to vote? Try Birthday Bot Premium!',
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
                if (!this.hasPermission(msg.member, command, guildData)) {
                    let embed = new MessageEmbed()
                        .setTitle('Permission Required!')
                        .setDescription(`You don't have permission to run that command!`)
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                }
            }

            // Execute the command
            await command.execute(args, msg, channel);
        } catch (error) {
            // Notify sender that something went wrong
            Logger.error('The message-handler.ts class encountered an error!', error);
            try {
                let embed = new MessageEmbed()
                    .setDescription(`Something went wrong!`)
                    .addField('Error code', msg.id)
                    .addField('Contact support', Config.links.support)
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
            } catch {
                /*ignore*/
            }

            return;
        }
    }

    private getCommand(userCommand: string): Command {
        userCommand = userCommand.toLowerCase();
        for (let cmd of this.commands) {
            if (cmd.name === userCommand.toLowerCase()) {
                return cmd;
            }

            if (cmd.aliases.includes(userCommand)) {
                return cmd;
            }
        }
    }

    private hasPermission(member: GuildMember, command: Command, guildData: GuildData): boolean {
        if (command.adminOnly) {
            if (member.hasPermission(Permissions.FLAGS.ADMINISTRATOR)) return true;

            if (guildData) {
                // Check if member has a required role
                let memberRoles = member.roles.cache.map(role => role.id);
                if (
                    guildData.BirthdayMasterRoleDiscordId &&
                    memberRoles.includes(guildData.BirthdayMasterRoleDiscordId)
                ) {
                    return true;
                }
            }
            return false;
        }
        return true;
    }
}
