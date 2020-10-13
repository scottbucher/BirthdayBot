import { BlacklistRepo, GuildRepo } from '../services/database/repos';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { GuildUtils } from '../utils';

let Config = require('../../config/config.json');

export class BlacklistCommand implements Command {
    public name: string = 'blacklist';
    public aliases = ['bl'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;
    public voteOnly = false;

    constructor(private blacklistRepo: BlacklistRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 2) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription('Please specify the option!\nAccepted Values: `add` or `remove`')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        } else if (args.length === 3) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription('Please specify a user!')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        // Get who they are mentioning
        let target =
            msg.mentions.members.first()?.user || GuildUtils.findMember(msg.guild, args[3])?.user;

        // Did we find a user?
        if (!target) {
            let embed = new MessageEmbed()
                .setDescription('Could not find that user!')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        if (!target) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription('Could not find that user!')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        if (args[2].toLowerCase() === 'add') {
            await this.blacklistRepo.addBlacklist(msg.guild.id, target.id);

            let embed = new MessageEmbed()
                .setDescription(`Successfully added ${target.toString()} to the birthday blacklist!`)
                .setColor(Config.colors.success);
            await channel.send(embed);
        } else if (args[2].toLowerCase() === 'remove') {
            await this.blacklistRepo.removeBlacklist(msg.guild.id, target.id);

            let embed = new MessageEmbed()
            .setDescription(`Successfully removed ${target.toString()} from the birthday blacklist!`)
                .setColor(Config.colors.success);
            await channel.send(embed);
        }
    }
}
