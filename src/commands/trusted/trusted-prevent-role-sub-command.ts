import { FormatUtils, MessageUtils } from '../../utils';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

const errorEmbed = new MessageEmbed()
    .setTitle('Invalid Usage!')
    .setDescription('Please provide a value! (True/False)')
    .setColor(Config.colors.error);

export class TrustedPreventRoleSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        let preventRole = FormatUtils.findBoolean(args[3]);

        if (preventRole === undefined || preventRole === null) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Value!')
                .setDescription('Accepted Values: `True/False`')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        await this.guildRepo.updateTrustedPreventsRole(msg.guild.id, preventRole ? 1 : 0);

        let embed = new MessageEmbed()
            .setDescription(
                preventRole
                    ? 'Trusted Role is now required for the birthday role!'
                    : 'Trusted Role is now not required for the birthday role!'
            )
            .setColor(Config.colors.success);
        await MessageUtils.send(channel, embed);
    }
}
