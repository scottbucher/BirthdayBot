import { CustomMessageRepo, GuildRepo } from '../../services/database/repos';
import { FormatUtils, MessageUtils } from '../../utils';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

let Config = require('../../../config/config.json');

export class MessageTestSubCommand {
    constructor(private guildRepo: GuildRepo, private customMessageRepo: CustomMessageRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        let userCount = 1;

        if (args.length < 4) {
            let embed = new MessageEmbed()
                .setDescription(
                    'Please provide a message number or user!\nFind this using `bday message list`!'
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        } else if (args.length >= 5) {
            try {
                userCount = parseInt(args[4]);
            } catch (error) {
                userCount = 1;
            }
        }

        let type = args[3]?.toLowerCase();

        // TODO: Implement
        // if (type === 'birthday') {
        // } else if (type === 'memberanniversary') {
        // } else if (type === 'serveranniversary') {
        // }

        // Try and find someone they are mentioning
        let target = msg.mentions.members.first()?.user;
        let position: number;

        if (!target) {
            userCount = userCount > 5 ? 5 : userCount;

            // Try and get the position
            try {
                position = parseInt(args[3]);
            } catch (error) {
                let embed = new MessageEmbed()
                    .setDescription('Invalid message number!\nFind this using `bday message list`!')
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
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
                await MessageUtils.send(channel, embed);
                return;
            }
        } else {
            userCount = 1;
        }

        let users: string[] = [];

        for (let i = 0; i < userCount; i++) {
            target ? users.push(target.toString()) : users.push(msg.author.toString());
        }

        let userList = userCount > 1 ? FormatUtils.joinWithAnd(users) : msg.author.toString();

        // Get guild data
        let guildData = await this.guildRepo.getGuild(msg.guild.id);

        // Retrieve message to remove
        let messages = target
            ? await this.customMessageRepo.getCustomUserMessages(msg.guild.id, type)
            : await this.customMessageRepo.getCustomMessages(msg.guild.id, type);

        if (!messages) {
            let embed = new MessageEmbed()
                .setDescription(`Happy Birthday ${userList}!`)
                .setColor(Config.colors.default);
            await MessageUtils.send(channel, embed);
            return;
        }

        let chosenMessage = target
            ? messages.customMessages.find(message => message.UserDiscordId === target.id)
            : messages.customMessages.find(message => message.Position === position);

        let customMessage: string = target
            ? chosenMessage?.Message.replace(/@Users/g, userList).replace(/<Users>/g, userList)
            : chosenMessage?.Message.replace(/@Users/g, userList).replace(/<Users>/g, userList);

        if (!customMessage) {
            let embed = new MessageEmbed()
                .setTitle('Test Custom Message')
                .setDescription(
                    `Message does not exist!\nView your server's custom messages with \`bday message list\`!`
                )
                .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        if (chosenMessage.Embed) {
            let embed = new MessageEmbed()
                .setDescription(customMessage)
                .setColor(Config.colors.default);
            await MessageUtils.send(channel, embed);
        } else {
            await MessageUtils.send(channel, customMessage);
        }
    }
}
