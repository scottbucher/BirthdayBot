import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';

let Config = require('../../../config/config.json');

export class MessageTimeSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        //bday message time <type> <0-23>
        let type = args[3]?.toLowerCase();

        if (
            !type ||
            (type !== 'birthday' && type !== 'memberanniversary' && type !== 'serveranniversary')
        ) {
            let embed = new MessageEmbed()
                .setDescription('Please provide a message type! -- replace with LANG')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        if (args.length < 5) {
            let embed = new MessageEmbed()
                .setDescription('Please provide a time! (0-23)')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        // Try and get the time
        let messageTime: number;
        try {
            messageTime = parseInt(args[4]);
        } catch (error) {
            let embed = new MessageEmbed()
                .setTitle('Invalid time!')
                .setDescription('Accepted Values: `0-23`')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        if (messageTime !== 0 && (messageTime < 0 || messageTime > 23 || !messageTime)) {
            let embed = new MessageEmbed()
                .setTitle('Invalid time!')
                .setDescription('Accepted Values: `0-23`')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        let timeOutput: string;
        if (messageTime === 0) timeOutput = '12:00 AM';
        else if (messageTime === 12) timeOutput = '12:00 PM';
        else if (messageTime < 12) timeOutput = messageTime + ':00 AM';
        else timeOutput = messageTime - 12 + ':00 PM';

        if (type === 'birthday') {
            await this.guildRepo.updateBirthdayMessageTime(msg.guild.id, messageTime);
            let embed = new MessageEmbed()
                .setDescription(
                    `Successfully set the birthday message to send at **${timeOutput}**!`
                )
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        } else if (type === 'memberanniversary') {
            await this.guildRepo.updateMemberAnniversaryMessageTime(msg.guild.id, messageTime);
            let embed = new MessageEmbed()
                .setDescription(
                    `Successfully set the member anniversary message to send at **${timeOutput}**!`
                )
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        } else if (type === 'serveranniversary') {
            await this.guildRepo.updateServerAnniversaryMessageTime(msg.guild.id, messageTime);
            let embed = new MessageEmbed()
                .setDescription(
                    `Successfully set the server anniversary message to send at **${timeOutput}**!`
                )
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        }
    }
}
