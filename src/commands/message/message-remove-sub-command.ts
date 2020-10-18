import { GuildUtils, MessageUtils } from '../../utils';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

export class MessageRemoveSubCommand {
    constructor(private customMessageRepo: CustomMessageRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length < 4) {
            let embed = new MessageEmbed()
                .setDescription(
                    'Please provide a message number!\nFind this using `bday message list`!'
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        // Retrieve message to remove
        let customMessages = await this.customMessageRepo.getCustomMessages(msg.guild.id);

        if (!customMessages) {
            let embed = new MessageEmbed()
                .setDescription('This server doesn\'t have any custom messages!')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        // Try and get the position
        let position: number;

        // Try and find someone they are mentioning
        let target =
            msg.mentions.members.first()?.user || GuildUtils.findMember(msg.guild, args[3])?.user;

        // Did we find a user?
        if (target) {
            let userMessage = customMessages.customMessages.filter(
                message => message.UserDiscordId === target.id
            );

            if (userMessage.length > 0) position = userMessage[0].Position;
        }

        if (!position) {
            try {
                position = parseInt(args[3]);
            } catch (error) {
                let embed = new MessageEmbed()
                    .setTitle('Invalid position!')
                    .setDescription('Use `bday message list` to view your server\'s custom messages!')
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }
        }

        if (!position) {
            let embed = new MessageEmbed()
                .setTitle('Remove Custom Message')
                .setDescription(
                    `Message number does not exist!\nView your server's custom messages with \`bday message list\`!`
                )
                .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        let message = customMessages.customMessages.find(question => question.Position === position);

        if (!message) {
            let embed = new MessageEmbed()
                .setTitle('Remove Custom Message')
                .setDescription(
                    `Message number does not exist!\nView your server's custom messages with \`bday message list\`!`
                )
                .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        // Remove the question
        await this.customMessageRepo.removeCustomMessage(msg.guild.id, position);

        let embed = new MessageEmbed()
            .setTitle('Remove Custom Message')
            .setDescription(message.Message)
            .setFooter(`${Config.emotes.confirm} Message removed.`, msg.client.user.avatarURL())
            .setTimestamp()
            .setColor(Config.colors.success);
        await MessageUtils.send(channel, embed);
    }
}
