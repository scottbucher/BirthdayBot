import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { GuildRepo } from '../services/database/repos';

let Config = require('../../config/config.json');

export class ClearCommand implements Command {
    public name: string = 'clear';
    public aliases = ['remove'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;
    public voteOnly = false;

    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 2) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    'Please specify what to create!\nAccepted Values: `channel`, `role`, `trustedRole`'
                )
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        if (args[2].toLowerCase() === 'channel') {
            await this.guildRepo.updateBirthdayChannel(msg.guild.id, '0');

            let embed = new MessageEmbed()
                .setDescription(`Successfully cleared the birthday channel!`)
                .setColor(Config.colors.success);
            await channel.send(embed);
        } else if (args[2].toLowerCase() === 'role') {
            await this.guildRepo.updateBirthdayRole(msg.guild.id, '0');

            let embed = new MessageEmbed()
                .setDescription(`Successfully cleared the birthday role!`)
                .setColor(Config.colors.success);
            await channel.send(embed);
        } else if (args[2].toLowerCase() === 'trustedrole') {
            await this.guildRepo.updateTrustedRole(msg.guild.id, '0');

            let embed = new MessageEmbed()
                .setDescription(`Successfully cleared the trusted role!`)
                .setColor(Config.colors.success);
            await channel.send(embed);
        }
    }
}
