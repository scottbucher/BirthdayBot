import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { GuildRepo } from '../services/database/repos';
import { MessageUtils } from '../utils';

let Config = require('../../config/config.json');

export class SetNameFormatCommand implements Command {
    public name: string = 'nameformat';
    public aliases = [];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
        let setting = args[2]?.toLowerCase();
        if (
            setting !== 'mention' &&
            setting !== 'default' &&
            setting !== 'username' &&
            setting !== 'nickname' &&
            setting !== 'tag'
        ) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Setting')
                .setDescription(
                    `Accepted Values:\n\`mention (default)\`:${msg.author.toString()}\n\`username\`: **${
                        msg.author.username
                    }**\n\`nickname\`: **${msg.member.displayName}**\n\`tag\`: **${
                        msg.author.username
                    }#${msg.author.discriminator}**\n`
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        if (setting === 'default') setting = 'mention';

        await this.guildRepo.updateNameFormat(msg.guild.id, setting);

        let embed = new MessageEmbed()
            .setColor(Config.colors.success)
            .setDescription(
                `Successfully updated your name format setting to \`${setting}\`!\nNames will now appear in this format: **${
                    setting === 'mention'
                        ? msg.author.toString()
                        : setting === 'nickname'
                        ? msg.member.displayName
                        : setting === 'username'
                        ? msg.author.username
                        : `${msg.author.username}#${msg.author.discriminator}`
                }**`
            );

        if (args[2].toLowerCase()) await MessageUtils.send(channel, embed);
    }
}
