import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos/custom-message-repo';

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
            await channel.send(embed);
            return;
        }
        // Try and get the time
        let position: number;
        try {
            position = parseInt(args[3]);
        } catch (error) {
            let embed = new MessageEmbed()
                .setTitle('Invalid time!')
                .setDescription('Accepted Values: `0-23`')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        if (!position) {
            let embed = new MessageEmbed()
                .setTitle('Remove Custom Message')
                .setDescription(
                    'Message number does not exist!\nView your server\'s custom messages with `bday message list`!'
                )
                .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        // Retrieve message to remove
        let messages = await this.customMessageRepo.getCustomMessages(msg.guild.id);
        let message = messages.customMessages.find(question => question.Position === position);

        if (!message) {
            let embed = new MessageEmbed()
                .setTitle('Remove Custom Message')
                .setDescription(
                    'Message number does not exist!\nView your server\'s custom messages with `bday message list`!'
                )
                .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                .setColor(Config.colors.error);
            await channel.send(embed);
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
        await channel.send(embed);
    }
}
