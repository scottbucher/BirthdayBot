import { CustomMessage, CustomMessages } from '../../models/database';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';

let Config = require('../../../config/config.json');

export class MessageRemoveSubCommand {
    constructor(private customMessageRepo: CustomMessageRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        let type = args[3]?.toLowerCase();

        if (
            !type ||
            (type !== 'birthday' && type !== 'memberanniversary' && type !== 'serveranniversary')
        ) {
            let embed = new MessageEmbed()
                .setTitle('Remove Custom Message')
                .setDescription(
                    `Please specify a message type! Accepted Values: \`birthday\`, \`memberAnniversary\`, \`serverAnniversary\``
                )
                .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        if (args.length < 5) {
            let embed = new MessageEmbed()
                .setDescription(
                    'Please provide a message number!\nFind this using `bday message list <type>`!'
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        // Try and find someone they are mentioning
        let target = msg.mentions.members.first()?.user;

        // Try and get the position
        let position: number;

        // Retrieve message to remove
        let customMessages = await this.customMessageRepo.getCustomMessages(msg.guild.id, type);
        let userMessages: CustomMessages;

        if (type === 'birthday') {
            if (target) {
                userMessages = await this.customMessageRepo.getCustomUserMessages(
                    msg.guild.id,
                    type
                );

                if (!userMessages) {
                    let embed = new MessageEmbed()
                        .setDescription(
                            `This server doesn't have any user specific custom birthday messages!`
                        )
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                }

                let userMessage = userMessages.customMessages.filter(
                    message => message.UserDiscordId === target.id
                );

                if (userMessage.length > 0) position = userMessage[0].Position;
            }
        }

        if (!position) {
            try {
                position = parseInt(args[4]);
            } catch (error) {
                let embed = new MessageEmbed()
                    .setTitle('Invalid position!')
                    .setDescription(
                        `Use \`bday message list <type>\` to view your server's custom messages!`
                    )
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }
        }

        if (!position) {
            let embed = new MessageEmbed()
                .setTitle('Remove Custom Message')
                .setDescription(
                    `Message number does not exist!\nView your server's custom messages with \`bday message list <type>\`!`
                )
                .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        let message: CustomMessage;

        // find the position based on if it is a user or global message
        target
            ? (message = userMessages.customMessages.find(
                  question => question.Position === position
              ))
            : (message = customMessages.customMessages.find(
                  question => question.Position === position
              ));

        if (!message) {
            let embed = new MessageEmbed()
                .setTitle('Remove Custom Message')
                .setDescription(
                    `Message number does not exist!\nView your server's custom messages with \`bday message list <type>\`!`
                )
                .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        // Remove the question base on if it is a user or global message
        target
            ? await this.customMessageRepo.removeCustomMessageUser(msg.guild.id, position, type)
            : await this.customMessageRepo.removeCustomMessage(msg.guild.id, position, type);

        let embed = new MessageEmbed()
            .setTitle('Remove Custom Message')
            .setDescription(message.Message)
            .setFooter(`${Config.emotes.confirm} Message removed.`, msg.client.user.avatarURL())
            .setTimestamp()
            .setColor(Config.colors.success);
        await MessageUtils.send(channel, embed);
    }
}
