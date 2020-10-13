import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { BlacklistRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

export class BlacklistClearSubCommand {
    constructor(private blacklistRepo: BlacklistRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {

        await this.blacklistRepo.clearBlacklist(msg.guild.id);

        let embed = new MessageEmbed()
            .setDescription(`Successfully cleared the birthday blacklist!`)
            .setColor(Config.colors.success);
        await channel.send(embed);
    }
}
