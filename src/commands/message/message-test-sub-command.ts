import { CustomMessageRepo, GuildRepo } from '../../services/database/repos';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { FormatUtils } from '../../utils';

let Config = require('../../../config/config.json');

export class MessageTestSubCommand {
    constructor(private guildRepo: GuildRepo, private customMessageRepo: CustomMessageRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        let userCount = 1;

        if (args.length < 4) {
            let embed = new MessageEmbed()
                .setDescription(
                    'Please provide a message number!\nFind this using `bday message list`!'
                )
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        } else if (args.length >= 5) {
            try {
                userCount = parseInt(args[4]);
            } catch (error) {
                userCount = 1;
            }
        }

        userCount = userCount > 5 ? 5 : userCount;

        // Try and get the time
        let position: number;
        try {
            position = parseInt(args[3]);
        } catch (error) {
            let embed = new MessageEmbed()
                .setDescription('Invalid message number!\nFind this using `bday message list`!')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        if (!position) {
            let embed = new MessageEmbed()
                .setTitle('Test Custom Message')
                .setDescription(
                    `Message number does not exist!\nView your server's custom messages with \`bday message list\`!`
                )
                .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        let users: string[] = [];

        for (let i = 0; i < userCount; i++) {
            users.push(msg.author.toString());
        }

        let userList = userCount > 1 ? FormatUtils.joinWithAnd(users) : msg.author.toString();

        // Get guild data
        let guildData = await this.guildRepo.getGuild(msg.guild.id);

        // Retrieve message to remove
        let messages = await this.customMessageRepo.getCustomMessages(msg.guild.id);

        if (!messages) {
            let defaultMessage = `Happy Birthday ${userList}!`;
            if (guildData.UseEmbed) {
                let embed = new MessageEmbed()
                    .setDescription(defaultMessage)
                    .setColor(Config.colors.default);
                await channel.send(embed);
                return;
            } else {
                await channel.send(defaultMessage);
                return;
            }
        }

        let customMessage: string = messages.customMessages
            .find(question => question.Position === position)
            ?.Message.replace(/@Users/g, userList)
            .replace(/<Users>/g, userList);

        if (!customMessage) {
            let embed = new MessageEmbed()
                .setTitle('Test Custom Message')
                .setDescription(
                    `Message does not exist!\nView your server's custom messages with \`bday message list\`!`
                )
                .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        if (guildData.UseEmbed) {
            let embed = new MessageEmbed()
                .setDescription(customMessage)
                .setColor(Config.colors.default);
            await channel.send(embed);
        } else {
            await channel.send(customMessage);
        }
    }
}
