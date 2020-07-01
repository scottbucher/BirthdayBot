import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { FormatUtils } from '../../utils';
import { GuildRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

export class MessageEmbedSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length < 4) {
            let embed = new MessageEmbed()
                .setDescription('Please provide a value! (True/False)')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        let useEmbed = FormatUtils.findBoolean(args[3]);

        if (useEmbed === undefined || useEmbed === null) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Value!')
                .setDescription('Accepted Values: `True/False`')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        await this.guildRepo.updateUseEmbed(msg.guild.id, useEmbed ? 1 : 0);

        let embed = new MessageEmbed()
            .setDescription(
                useEmbed
                    ? 'The birthday message will now be embedded!'
                    : 'The birthday message will no longer be embedded!'
            )
            .setColor(Config.colors.success);
        await channel.send(embed);
    }
}
