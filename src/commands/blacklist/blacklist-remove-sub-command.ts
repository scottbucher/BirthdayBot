import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { BlacklistRepo } from '../../services/database/repos';
import { GuildUtils } from '../../utils';

let Config = require('../../../config/config.json');

export class BlacklistRemoveSubCommand {
    constructor(private blacklistRepo: BlacklistRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 3) {
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

        if (target.bot) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription('You cannot blacklist a bot!')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        let blacklist = await this.blacklistRepo.getBlacklist(msg.guild.id);

        if (!blacklist.blacklist.map(entry => entry.UserDiscordId).includes(msg.author.id)) {
            let embed = new MessageEmbed()
                .setDescription('This user isn\'t in the blacklist!')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        await this.blacklistRepo.removeBlacklist(msg.guild.id, target.id);

        let embed = new MessageEmbed()
            .setDescription(`Successfully removed ${target.toString()} from the birthday blacklist!`)
            .setColor(Config.colors.success);
        await channel.send(embed);
    }
}
