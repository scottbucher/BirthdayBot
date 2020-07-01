import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { GuildRepo } from '../services/database/repos';
import { SetupUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');

export class SetupCommand implements Command {
    public name: string = 'setup';
    public aliases = ['configure', 'set-up'];
    public requireSetup = false;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;

    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (!msg.guild.me.hasPermission('ADD_REACTIONS')) {
            let embed = new MessageEmbed()
                .setTitle('Not Enough Permissions!')
                .setDescription('The bot must have permission to add reactions to messages!')
                .setColor(Config.colors.error);

            await channel.send(embed);
            return;
        }

        if (args.length === 2) {
            // Required Setup
            if (
                !msg.guild.me.hasPermission('MANAGE_CHANNELS') ||
                !msg.guild.me.hasPermission('MANAGE_ROLES')
            ) {
                let embed = new MessageEmbed()
                    .setTitle('Not Enough Permissions!')
                    .setDescription('The bot must have permission to manage channels and roles!')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }
            await SetupUtils.executeRequiredSetup(args, msg, channel, this.guildRepo);
        } else {
            let guildData = await this.guildRepo.getGuild(msg.guild.id);
            if (!guildData) {
                let embed = new MessageEmbed()
                    .setTitle('Setup Required!')
                    .setDescription('You must run `bday setup` before using this command!')
                    .setColor(Config.colors.error);

                await channel.send(embed);
                return;
            }

            if (args[2].toLowerCase() === 'message') {
                // Run Message Setup
                SetupUtils.executeMessageSetup(args, msg, channel, this.guildRepo);
            } else if (args[2].toLowerCase() === 'trusted') {
                // Run Trusted Setup
                if (!msg.guild.me.hasPermission('MANAGE_ROLES')) {
                    let embed = new MessageEmbed()
                        .setTitle('Not Enough Permissions!')
                        .setDescription('The bot must have permission to manage  roles!')
                        .setColor(Config.colors.error);
                    await channel.send(embed);
                    return;
                }
                await SetupUtils.executeTrustedSetup(args, msg, channel, this.guildRepo);
            } else {
                let embed = new MessageEmbed()
                    .setTitle('Invalid Usage!')
                    .setDescription('Please specify which setup!\nSetups: `message` or `trusted`')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }
        }
    }
}
