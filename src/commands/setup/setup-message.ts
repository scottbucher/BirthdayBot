import { Message, MessageEmbed, MessageReaction, Role, TextChannel, User } from 'discord.js';
import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';

import { GuildRepo } from '../../services/database/repos';
import { ActionUtils } from '../../utils';

let Config = require('../../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.promptExpireTime * 1000,
    reset: true,
};

export class SetupMessage {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        let guild = channel.guild;
        let botUser = guild.client.user;
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id && nextMsg.content.startsWith('bday ');
        let expireFunction: ExpireFunction = async () => {
            await channel.send(
                new MessageEmbed()
                    .setTitle('Message Setup - Expired')
                    .setDescription('Type `bday setup message` to rerun the setup.')
                    .setColor(Config.colors.error)
            );
        };

        let messageTime: number;
        let mention: string;
        let useEmbed: number;

        let messageTimeEmbed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Message Setup - Birthday Message Time')
            .setDescription(
                'Please give the hour for your Birthday Messages [(?)](https://birthdaybot.scottbucher.dev/faq#what-is-the-birthday-message-time)' +
                    '\n\nAccepted Values: `0-23`\nDefault Value: `0`' +
                    '\n\n**Example Usage**: `13` (1PM)'
            )
            .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        let timeMessage = await channel.send(messageTimeEmbed);

        messageTime = await CollectorUtils.collectByMessage(
            msg.channel,
            // Collect Filter
            (nextMsg: Message) => nextMsg.author.id === msg.author.id,
            stopFilter,
            // Retrieve Result
            async (nextMsg: Message) => {
                if (!messageTime && messageTime !== 0) {
                    // Try and get the time
                    let time: number;
                    try {
                        time = parseInt(nextMsg.content.split(' ')[0]);
                    } catch (error) {
                        let embed = new MessageEmbed()
                            .setTitle('Message Setup - Message Time')
                            .setDescription('Invalid time!')
                            .setFooter(`Please check above and try again!`, botUser.avatarURL())
                            .setTimestamp()
                            .setColor(Config.colors.error);
                        await channel.send(embed);
                        return;
                    }

                    if (time !== 0 && (time < 0 || time > 23 || !time)) {
                        let embed = new MessageEmbed()
                            .setTitle('Message Setup - Message Time')
                            .setDescription('Invalid time!')
                            .setFooter(`Please check above and try again!`, botUser.avatarURL())
                            .setTimestamp()
                            .setColor(Config.colors.error);
                        await channel.send(embed);
                        return;
                    }
                    return time;
                }
            },
            expireFunction,
            COLLECT_OPTIONS
        );

        ActionUtils.deleteMessage(timeMessage);

        if (messageTime === undefined) {
            return;
        }

        let messageMentionEmbed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Message Setup - Birthday Message Mention')
            .setDescription(
                'Now you can set your birthday message mention! [(?)](https://birthdaybot.scottbucher.dev/faq#what-is-the-birthday-message-mention)' +
                    '\n\nAcceptable inputs: `everyone`, `here`, `@role/role-name`, or `none`' +
                    '\n\nDefault Value: `none`'
            )
            .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        let mentionMessage = await channel.send(messageMentionEmbed);

        mention = await CollectorUtils.collectByMessage(
            msg.channel,
            // Collect Filter
            (nextMsg: Message) => nextMsg.author.id === msg.author.id,
            stopFilter,
            // Retrieve Result
            async (nextMsg: Message) => {
                // Find mentioned role
                let roleInput: Role = nextMsg.mentions.roles.first();

                if (!roleInput) {
                    roleInput = guild.roles.cache.find(role =>
                        role.name.toLowerCase().includes(nextMsg?.content.toLowerCase())
                    );
                }

                if (!roleInput || roleInput.guild.id !== guild.id) {
                    // If there is no roles then check for other accepted values
                    let roleOptions = ['everyone', 'here', '@here', 'none'];
                    if (!roleOptions.includes(nextMsg?.content.toLowerCase())) {
                        let embed = new MessageEmbed()
                            .setTitle('Message Setup - Birthday Message Mention')
                            .setDescription('Could not find the group or role!')
                            .setFooter(`Please check above and try again!`, botUser.avatarURL())
                            .setTimestamp()
                            .setColor(Config.colors.error);
                        await channel.send(embed);
                        return;
                    } else {
                        if (nextMsg?.content.toLowerCase() === '@here') {
                            // Support for the @here input
                            mention = `here`;
                        } else {
                            mention = nextMsg?.content.toLowerCase(); // Else it is either here, everyone, or none
                        }
                    }
                } else {
                    mention = roleInput?.id; // If roleInput does exists then get the role Id
                }
                return mention;
            },
            expireFunction,
            COLLECT_OPTIONS
        );

        ActionUtils.deleteMessage(mentionMessage);

        if (mention === undefined) {
            return;
        }

        let embedMessage = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Message Setup - Embed Birthday Message')
            .setDescription(
                'Now you can choose if the Birthday Message should be embedded or not! [(?)](https://birthdaybot.scottbucher.dev/faq#what-is-an-embed)' +
                    '\n\nDisable this if you use a image/gif in your Custom Birthday Message. [(?)](https://birthdaybot.scottbucher.dev/faq#what-is-the-custom-birthday-message)' +
                    `\n\nEnabled: ${Config.emotes.confirm}` +
                    `\nDisabled: ${Config.emotes.deny}`
            )
            .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        let reactOptions = [Config.emotes.confirm, Config.emotes.deny];

        let optionMessage = await channel.send(embedMessage);
        for (let reactOption of reactOptions) {
            await optionMessage.react(reactOption);
        }

        let messageOption: string = await CollectorUtils.collectByReaction(
            optionMessage,
            // Collect Filter
            (msgReaction: MessageReaction, reactor: User) =>
                reactor.id === msg.author.id && reactOptions.includes(msgReaction.emoji.name),
            stopFilter,
            // Retrieve Result
            async (msgReaction: MessageReaction, reactor: User) => {
                return msgReaction.emoji.name;
            },
            expireFunction,
            COLLECT_OPTIONS
        );

        ActionUtils.deleteMessage(optionMessage);

        if (messageOption === undefined) return;

        useEmbed = messageOption === Config.emotes.confirm ? 1 : 0;
        let timeOutput: string;
        if (messageTime === 0) timeOutput = '12:00 AM';
        else if (messageTime === 12) timeOutput = '12:00 PM';
        else if (messageTime < 12) timeOutput = messageTime + ':00 AM';
        else timeOutput = messageTime - 12 + ':00 PM';

        let mentionOutput: string;

        // Find mentioned role
        let roleInput: Role = guild.roles.resolve(mention);

        if (!roleInput || roleInput.guild.id !== guild.id) {
            if (mention.toLowerCase() === 'everyone' || mention.toLowerCase() === 'here') {
                mentionOutput = '@' + mention;
            } else if (mention.toLowerCase() === 'none') {
                mentionOutput = '`None`';
            }
        } else {
            mentionOutput = roleInput.toString();
        }

        let embed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Message Setup - Completed')
            .setDescription(
                'You have successfully completed the server message setup!' +
                    `\n\n**Birthday Message Time**: \`${timeOutput}\`` +
                    `\n**Mention Setting**: ${mentionOutput}` +
                    `\n**Use Embed**: \`${useEmbed === 1 ? 'True' : 'False'}\``
            )
            .setFooter(`Message Setup Complete!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        if (mention === 'none') mention = '0';

        await this.guildRepo.guildSetupMessage(guild.id, messageTime, mention, useEmbed);

        await channel.send(embed);
    }
}
