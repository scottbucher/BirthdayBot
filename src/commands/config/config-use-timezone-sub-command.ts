import { FormatUtils, MessageUtils } from '../../utils';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

const errorEmbed = new MessageEmbed()
    .setTitle('Invalid Usage!')
    .setDescription(
        `Please select a option:\n\`server\` - Celebrate birthdays based on the server's timezone.\n\`user\` - Celebrate birthdays based on the user's timezone.`
    )
    .setColor(Config.colors.error);

export class ConfigUseTimezoneSubCommand {
    constructor(private guildRepo: GuildRepo) { }

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        let option = args[3].toLowerCase();

        if (option !== 'user' && option !== 'server') {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        await this.guildRepo.updateUseTimezone(msg.guild.id, option);

        let embed = new MessageEmbed()
            .setDescription(`Birthdays will now be celebrated based on the ${option}'s timezone!`)
            .setColor(Config.colors.success);
        await MessageUtils.send(msg.channel as TextChannel, embed);
    }
}
