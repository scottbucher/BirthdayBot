import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';
import { GuildRepo, UserRepo } from '../services/database/repos';
import { Lang, Logger, SubscriptionService } from '../services';
import { MessageUtils, PermissionUtils } from '../utils';

import { Command } from '../commands';
import { LangCode } from '../models/enums';
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
    ) { }

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
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.needReactAndMessageHistoryPerms', LangCode.EN_US)
                );
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
                        await MessageUtils.send(
                            channel,
                            Lang.getEmbed('validation.onlyStaff', LangCode.EN_US)
                        );
                        return;
                    }
                }
            }
        }

        // Check if the command is a server only command
        if (command.guildOnly && channel instanceof DMChannel) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.guildOnlyCommand', LangCode.EN_US)
            );
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
            await MessageUtils.send(
                channel,
                Lang.getEmbed('premiumRequired.command', LangCode.EN_US)
            );
            return;
        }

        if (checkVote && !hasPremium) {
            // Get the user's last vote and check if the command requires a vote
            let userVote = await this.userRepo.getUserVote(msg.author.id);
            let voteTime = moment(userVote?.VoteTime);
            let voteTimeAgo = userVote ? voteTime.fromNow() : Lang.getRef('terms.never', LangCode.EN_US);

            if (!userVote || voteTime.clone().add(Config.voting.hours, 'hours') < moment()) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.voteRequired', LangCode.EN_US, {
                        LAST_VOTE: voteTimeAgo,
                    })
                );
                return;
            }
        }

        try {
            // Check if command requires guild setup
            if (channel instanceof TextChannel) {
                let guildData = await this.guildRepo.getGuild(msg.guild.id);
                if (command.requireSetup && !guildData) {
                    await MessageUtils.send(
                        channel,
                        Lang.getEmbed('validation.setupRequired', LangCode.EN_US)
                    );
                    return;
                }

                // Check if user has permission
                if (!PermissionUtils.hasPermission(msg.member, guildData, command)) {
                    await MessageUtils.send(
                        channel,
                        Lang.getEmbed('validation.noPermission', LangCode.EN_US)
                    );
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
                    Lang.getEmbed('info.error', LangCode.EN_US, { ERROR_CODE: msg.id })
                );
            } catch {
                // Ignore
            }

            // Log command error
            if (msg.channel instanceof DMChannel) {
                Logger.error(
                    Logs.error.commandDm
                        .replace('{MESSAGE_ID}', msg.id)
                        .replace('{COMMAND_KEYWORD}', command.name)
                        .replace('{SENDER_TAG}', msg.author.tag)
                        .replace('{SENDER_ID}', msg.author.id),
                    error
                );
            } else if (msg.channel instanceof TextChannel) {
                Logger.error(
                    Logs.error.commandGuild
                        .replace('{MESSAGE_ID}', msg.id)
                        .replace('{COMMAND_KEYWORD}', command.name)
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
