import { FormatUtils, MessageUtils } from '../../utils';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

const errorEmbed = new MessageEmbed()
    .setTitle('Invalid Usage!')
    .setDescription('Please provide a value! (True/False)')
    .setColor(Config.colors.error);

export class ConfigTrustedPreventsMsgSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        let preventMessage = FormatUtils.findBoolean(args[3]);

        if (preventMessage === undefined || preventMessage === null) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Value!')
                .setDescription('Accepted Values: `True/False`')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
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
        await MessageUtils.send(channel, embed);
    }
}
