import { FormatUtils, MessageUtils } from '../../utils';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

const errorEmbed = new MessageEmbed()
    .setTitle('Invalid Usage!')
    .setDescription(`Please input a timezone! To find your timezone please use \`bday map\``)
    .setColor(Config.colors.error);

export class ConfigTimezoneSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        if (FormatUtils.checkAbbreviation(args[3])) {
            let embed = new MessageEmbed()
                .setDescription('Invalid time zone! Do not use timezone abbreviations!')
                .setFooter(`Please check above and try again!`, msg.client.user.avatarURL())
                .setTimestamp()
                .setTitle('Default Server Timezone Selection')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        let timezone = FormatUtils.findZone(args[3]); // Try and get the time zone
        if (!timezone) {
            let embed = new MessageEmbed()
                .setDescription('Invalid time zone!')
                .setFooter(`Please check above and try again!`, msg.client.user.avatarURL())
                .setTimestamp()
                .setTitle('Default Server Timezone Selection')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        await this.guildRepo.updateDefaultTimezone(msg.guild.id, timezone);

        let embed = new MessageEmbed()
            .setDescription(`Successfully set your server's default timezone to **${timezone}**`)
            .setColor(Config.colors.success);
        await MessageUtils.send(msg.channel as TextChannel, embed);
    }
}
