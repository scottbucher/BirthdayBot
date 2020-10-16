import { ColorResolvable, Message, MessageEmbed, Role, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');
let Color = require('color');

export class MessageColorSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length < 4) {
            let embed = new MessageEmbed()
                .setDescription(
                    'Please provide a valid hex color!'
                )
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        if (args[3].length === 6) args[3] = '#' + args[3];

        let color;
        try {
            color = Color(args[3]);
        } catch (error) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Color')
                .setDescription(
                    'Please provide a valid hex color! Find hex colors [here](https://htmlcolorcodes.com/).' +
                    '\n\nExample: `#4EEFFF` or `4EEFFF`'
                )
                .setTimestamp()
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        let embed = new MessageEmbed()
            .setDescription(
                `${msg.client.user.toString()} will now use the hex color ${color.hex()} in birthday messages!` +
                `\n\nHint: You can see an example of the color on the left side of this embed!`
            )
            .setColor(color.hex());

        await this.guildRepo.updateMessageEmbedColor(msg.guild.id, color.hex().substring(1));

        await channel.send(embed);
    }
}
