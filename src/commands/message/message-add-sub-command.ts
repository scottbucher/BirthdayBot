import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

export class MessageAddSubCommand {
    constructor(private customMessageRepo: CustomMessageRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length < 4) {
            let embed = new MessageEmbed()
                .setDescription('Please provide a message!')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        // Get Message
        let birthdayMessage = args
            .slice(3)
            .join(' ')
            .replace(/@users?|<users?>|{users?}/gi, '<Users>');

        if (birthdayMessage.length > 300) {
            let embed = new MessageEmbed()
                .setDescription('Custom Messages are maxed at 300 characters!')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        if (!birthdayMessage.includes('<Users>')) {
            let embed = new MessageEmbed()
                .setDescription(
                    'Please include a `<Users>` placeholder somewhere in the message. This indicates where birthday usernames will appear.'
                )
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        let customMessages = await this.customMessageRepo.getCustomMessages(msg.guild.id);

        if (customMessages && customMessages.customMessages.length > 100) {
            let embed = new MessageEmbed()
                .setDescription('Your server has reached the maximum custom messages! (100)')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        await this.customMessageRepo.addCustomMessage(msg.guild.id, birthdayMessage);

        let embed = new MessageEmbed()
            .setDescription(
                `Successfully added the birthday message \`${birthdayMessage}\`!` +
                    '\n\nTest this with `bday message test`'
            )
            .setColor(Config.colors.success);
        await channel.send(embed);
    }
}
