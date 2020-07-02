import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { GuildRepo } from '../services/database/repos';
import { FormatUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');

export class TrustedCommand implements Command {
    public name: string = 'trusted';
    public aliases = [];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;

    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 2) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    'Please specify what to create!\nAccepted Values: `preventMessage <T/F>` or `preventRole <T/F>`,'
                )
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        if (args[2].toLowerCase() === 'preventmsg' || args[2].toLowerCase() === 'preventmessage') {
            // Do Stuff
            if (args.length < 4) {
                let embed = new MessageEmbed()
                    .setDescription('Please provide a value! (True/False)')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }

            let preventMessage = FormatUtils.findBoolean(args[3]);

            if (preventMessage === undefined || preventMessage === null) {
                let embed = new MessageEmbed()
                    .setTitle('Invalid Value!')
                    .setDescription('Accepted Values: `True/False`')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }

            await this.guildRepo.updateTrustedPreventsMessage(msg.guild.id, preventMessage ? 1 : 0);

            let embed = new MessageEmbed()
                .setDescription(
                    preventMessage
                        ? 'Trusted Role is now required for the birthday message!'
                        : 'Trusted Role is now not required for the birthday message!'
                )
                .setColor(Config.colors.success);
            await channel.send(embed);
        } else if (args[2].toLowerCase() === 'preventrole') {
            // Do Stuff
            if (args.length < 4) {
                let embed = new MessageEmbed()
                    .setDescription('Please provide a value! (True/False)')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }

            let preventRole = FormatUtils.findBoolean(args[3]);

            if (preventRole === undefined || preventRole === null) {
                let embed = new MessageEmbed()
                    .setTitle('Invalid Value!')
                    .setDescription('Accepted Values: `True/False`')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }

            await this.guildRepo.updateTrustedPreventsRole(msg.guild.id, preventRole ? 1 : 0);

            let embed = new MessageEmbed()
                .setDescription(
                    preventRole
                        ? 'Trusted Role is now required for the birthday role!'
                        : 'Trusted Role is now not required for the birthday role!'
                )
                .setColor(Config.colors.success);
            await channel.send(embed);
        }
    }
}
