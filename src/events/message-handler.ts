import {
    DMChannel,
    GuildMember,
    Message,
    MessageEmbed,
    Permissions,
    TextChannel,
} from 'discord.js';

import { Command } from '../commands';
import { Logger } from '../services';
import { GuildRepo } from '../services/database/repos';
import { MessageUtils, PermissionUtils } from '../utils';

let Config = require('../../config/config.json');

export class MessageHandler {
    constructor(
        private defaultHelpCommand: Command,
        private commands: Command[],
        private guildRepo: GuildRepo
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
                    .setDescription(
                        'I need permission to **Add Reactions** & **Read Message History**!'
                    )
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }
        }

        // Check if first argument is prefix
        let args = msg.content.split(' ');
        if (args[0].toLowerCase() !== Config.prefix) {
            return;
        }

        // If only a prefix, run the help command
        if (args.length === 1) {
            await this.defaultHelpCommand.execute(args, msg, channel);
            return;
        }

        // Try to find the command the user wants
        let userCommand = args[1];
        let command = this.getCommand(userCommand);

        // If no command found, run the help command
        if (!command) {
            await this.defaultHelpCommand.execute(args, msg, channel);
            return;
        }

        if (command.ownerOnly && !Config.ownerIds.includes(msg.author.id)) {
            let embed = new MessageEmbed()
                .setDescription('This command can only be used by the bot owner!')
                .setColor(Config.colors.error);

            if (channel instanceof TextChannel) await channel.send(embed);
            else MessageUtils.sendDm(channel, embed);
            return;
        }

        if (command.guildOnly && channel instanceof DMChannel) {
            let embed = new MessageEmbed()
                .setDescription('This command can only be used in a discord server!')
                .setColor(Config.colors.error);
            MessageUtils.sendDm(channel, embed);
            return;
        }

        // channel.startTyping();
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
                    await channel.send(embed);
                    return;
                }
            }
            // Check if user has permission
            if (!this.hasPermission(msg.member, command)) {
                let embed = new MessageEmbed()
                    .setTitle('Permission Required!')
                    .setDescription(`You don't have permission to run that command!`)
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
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
                    .addField('Contact support', 'https://discord.gg/9gUQFtz')
                    .setColor(Config.colors.error);
                await channel.send(embed);
            } catch {
                /*ignore*/
            }

            // channel.stopTyping(true);

            return;
        }
    }

    private getCommand(userCommand: string) {
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

    private hasPermission(member: GuildMember, command: Command): boolean {
        if (command.adminOnly) {
            return member.hasPermission(Permissions.FLAGS.ADMINISTRATOR); // return true if they have admin
        }
        return true;
    }
}
