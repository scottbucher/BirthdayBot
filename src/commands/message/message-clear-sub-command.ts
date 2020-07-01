import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos/custom-message-repo';

let Config = require('../../../config/config.json');

export class MessageClearSubCommand {
    constructor(private customMessageRepo: CustomMessageRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        await this.customMessageRepo.clearCustomMessages(msg.guild.id);

        let embed = new MessageEmbed()
            .setDescription(`Successfully cleared all birthday messages from the database!`)
            .setColor(Config.colors.success);
        await channel.send(embed);
    }
}
