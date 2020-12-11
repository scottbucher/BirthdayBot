import { Message, MessageEmbed, TextChannel } from 'discord.js';
import {
    MessageAddSubCommand,
    MessageClearSubCommand,
    MessageEmbedSubCommand,
    MessageListSubCommand,
    MessageMentionSubCommand,
    MessageRemoveSubCommand,
    MessageTestSubCommand,
    MessageTimeSubCommand,
} from './message';

import { Command } from './command';
import { MessageColorSubCommand } from './message/message-color-sub-command';
import { MessageUserListSubCommand } from './message/message-user-list-sub-command';
import { MessageUtils } from '../utils';

let Config = require('../../config/config.json');

export class MessageCommand implements Command {
    public name: string = 'message';
    public aliases = ['msg'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = true;

    constructor(
        private messageListSubCommand: MessageListSubCommand,
        private messageClearSubCommand: MessageClearSubCommand,
        private messageAddSubCommand: MessageAddSubCommand,
        private messageRemoveSubCommand: MessageRemoveSubCommand,
        private messageTimeSubCommand: MessageTimeSubCommand,
        private messageMentionSubCommand: MessageMentionSubCommand,
        private messageEmbedSubCommand: MessageEmbedSubCommand,
        private messageTestSubCommand: MessageTestSubCommand,
        private messageColorSubCommand: MessageColorSubCommand,
        private messageUserListSubCommand: MessageUserListSubCommand
    ) {}

    public async execute(args: string[], msg: Message, channel: TextChannel, hasPremium: boolean) {
        if (args.length === 2) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    `Please specify a sub command for the custom birthday message! [(?)](${Config.links.docs}/faq#what-is-a-custom-birthday-message)\n` +
                        `Accepted Values: \`list\`, \`add <Value>\`, \`remove <#>\`, \`clear\`, \`time <0-23>\`, \`mention <Value>\`, \`useEmbed <T/F>\``
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }
        if (args[2].toLowerCase() === 'list' && args[3]?.toLowerCase() !== 'user') {
            this.messageListSubCommand.execute(args, msg, channel, hasPremium);
        } else if (args[2].toLowerCase() === 'list' && args[3]?.toLowerCase() === 'user') {
            this.messageUserListSubCommand.execute(args, msg, channel, hasPremium);
        } else if (args[2].toLowerCase() === 'clear') {
            this.messageClearSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'add' || args[2].toLowerCase() === 'create') {
            this.messageAddSubCommand.execute(args, msg, channel, hasPremium);
        } else if (args[2].toLowerCase() === 'remove' || args[2].toLowerCase() === 'delete') {
            this.messageRemoveSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'time') {
            this.messageTimeSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'mention' || args[2].toLowerCase() === 'role') {
            this.messageMentionSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'embed') {
            this.messageEmbedSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'test') {
            this.messageTestSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'color') {
            if (hasPremium) {
                this.messageColorSubCommand.execute(args, msg, channel);
            } else {
                let embed = new MessageEmbed()
                    .setTitle('Premium Required!')
                    .setDescription(
                        `Custom birthday message color is a premium feature! View information about **Birthday Bot Premium** using \`bday premium\`!`
                    )
                    .setFooter(
                        'Premium helps us support and maintain the bot!',
                        msg.client.user.avatarURL()
                    )
                    .setTimestamp()
                    .setColor(Config.colors.default);
                await MessageUtils.send(channel, embed);
                return;
            }
        } else {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    `Please specify a sub command for the custom birthday message! [(?)](${Config.links.docs}/faq#what-is-a-custom-birthday-message)\n` +
                        `Accepted Values: \`list\`, \`add <Value>\`, \`remove <#>\`, \`clear\`, \`time <0-23>\`, \`mention <Value>\`, \`useEmbed <T/F>\``
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }
    }
}
