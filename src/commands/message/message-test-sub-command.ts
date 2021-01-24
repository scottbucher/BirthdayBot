import { CustomMessageRepo, GuildRepo } from '../../services/database/repos';
import { FormatUtils, MessageUtils } from '../../utils';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import moment from 'moment';

let Config = require('../../../config/config.json');

export class MessageTestSubCommand {
    constructor(private guildRepo: GuildRepo, private customMessageRepo: CustomMessageRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        // bday message test <type> <position> [user count]
        let type = args[3]?.toLowerCase();

        if (
            !type ||
            (type !== 'birthday' && type !== 'memberanniversary' && type !== 'serveranniversary')
        ) {
            let embed = new MessageEmbed()
                .setDescription('Please provide a message type! -- replace with LANG')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        let userCount = 1;

        if (args.length < 5) {
            let embed = new MessageEmbed()
                .setDescription(
                    'Please provide a message number or user!\nFind this using `bday message list`!'
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        } else if (args.length >= 6) {
            try {
                userCount = parseInt(args[5]);
            } catch (error) {
                userCount = 1;
            }
        }
        // Try and find someone they are mentioning
        let target = msg.mentions.members.first();
        let position: number;

        if (!target) {
            userCount = userCount > 5 ? 5 : userCount;

            // Try and get the position
            try {
                position = parseInt(args[4]);
            } catch (error) {
                let embed = new MessageEmbed()
                    .setDescription(
                        'Invalid message number!\nFind this using `bday message list <type>`!'
                    )
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }

            if (!position) {
                let embed = new MessageEmbed()
                    .setTitle('Test Custom Message')
                    .setDescription(
                        `Message number does not exist!\nView your server's custom messages with \`bday message list <type>\`!`
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
        // let guildData = await this.guildRepo.getGuild(msg.guild.id);

        // Retrieve message to remove
        let messages = target
            ? await this.customMessageRepo.getCustomUserMessages(msg.guild.id, type)
            : await this.customMessageRepo.getCustomMessages(msg.guild.id, type);

        if (!messages) {
            switch (type) {
                case 'birthday': {
                    let embed = new MessageEmbed()
                        .setDescription(
                            Lang.getRef('defaults.birthdayMessage', LangCode.EN)
                                .replace(/<Users>/g, userList)
                                .replace(/<Server>/g, msg.guild.name)
                        )
                        .setColor(Config.colors.default);
                    await MessageUtils.send(channel, embed);
                    return;
                }
                case 'memberanniversary': {
                    let embed = new MessageEmbed()
                        .setDescription(
                            Lang.getRef('defaults.memberAnniversaryMessage', LangCode.EN)
                                .replace(/<Users>/g, userList)
                                .replace(
                                    /<Years>/g,
                                    Math.floor(
                                        moment().diff(msg.guild.createdAt, 'years')
                                    ).toString()
                                )
                                .replace(/<Server>/g, msg.guild.name)
                        )
                        .setColor(Config.colors.default);
                    await MessageUtils.send(channel, embed);
                    return;
                }
                case 'serveranniversary': {
                    let embed = new MessageEmbed()
                        .setDescription(
                            Lang.getRef('defaults.serverAnniversaryMessage', LangCode.EN)
                                .replace(
                                    /<Years>/g,
                                    Math.floor(moment().diff(target.joinedAt, 'years')).toString()
                                )
                                .replace(/<Server>/g, msg.guild.name)
                        )
                        .setColor(Config.colors.default);
                    await MessageUtils.send(channel, embed);
                    return;
                }
            }
        }

        let chosenMessage = target
            ? messages.customMessages.find(message => message.UserDiscordId === target.id)
            : messages.customMessages.find(message => message.Position === position);

        if (!target) target = msg.member;

        let customMessage: string;

        switch (type) {
            case 'birthday': {
                customMessage = chosenMessage?.Message.replace(/@Users/g, userList)
                    .replace(/<Users>/g, userList)
                    .replace(/<Server>/g, msg.guild.name);
                break;
            }
            case 'memberanniversary': {
                customMessage = chosenMessage?.Message.replace(/@Users/g, userList)
                    .replace(/<Users>/g, userList)
                    .replace(
                        /<Years>/g,
                        Math.floor(moment().diff(msg.guild.createdAt, 'years')).toString()
                    )
                    .replace(/<Server>/g, msg.guild.name);
                break;
            }
            case 'serveranniversary': {
                customMessage = chosenMessage?.Message.replace(
                    /<Years>/g,
                    Math.floor(moment().diff(target.joinedAt, 'years')).toString()
                ).replace(/<Server>/g, msg.guild.name);
                break;
            }
        }

        if (!customMessage) {
            let embed = new MessageEmbed()
                .setTitle('Test Custom Message')
                .setDescription(
                    `Message does not exist!\nView your server's custom messages with \`bday message list <type>\`!`
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
