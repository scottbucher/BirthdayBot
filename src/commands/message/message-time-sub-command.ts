import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

export class MessageTimeSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length < 4) {
            let embed = new MessageEmbed()
                .setDescription('Please provide a time! (0-23)')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        // Try and get the time
        let messageTime: number;
        try {
            messageTime = parseInt(args[3]);
        } catch (error) {
            let embed = new MessageEmbed()
                .setTitle('Invalid time!')
                .setDescription('Accepted Values: `0-23`')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        if (messageTime < 0 || messageTime > 23 || !messageTime) {
            let embed = new MessageEmbed()
                .setTitle('Invalid time!')
                .setDescription('Accepted Values: `0-23`')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }
        await this.guildRepo.updateMessageTime(msg.guild.id, messageTime);

        let timeOutput: string;
        if (messageTime === 0) timeOutput = '12:00 AM';
        else if (messageTime === 12) timeOutput = '12:00 PM';
        else if (messageTime < 12) timeOutput = messageTime + ':00 AM';
        else timeOutput = messageTime - 12 + ':00 PM';

        let embed = new MessageEmbed()
            .setDescription(`Successfully set the birthday message to send at **${timeOutput}**!`)
            .setColor(Config.colors.success);
        await channel.send(embed);
    }
}
