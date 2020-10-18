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
    public getPremium = false;

    constructor(
        private messageListSubCommand: MessageListSubCommand,
        private messageClearSubCommand: MessageClearSubCommand,
        private messageAddSubCommand: MessageAddSubCommand,
        private messageRemoveSubCommand: MessageRemoveSubCommand,
        private messageTimeSubCommand: MessageTimeSubCommand,
        private messageMentionSubCommand: MessageMentionSubCommand,
        private messageEmbedSubCommand: MessageEmbedSubCommand,
        private messageTestSubCommand: MessageTestSubCommand,
        private messageColorSubCommand: MessageColorSubCommand
    ) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 2) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    `Please specify a sub command for the custom birthday message! [(?)](${Config.links.docs}/faq#what-is-a-custom-birthday-message)\nAccepted Values: \`list\`, \`add <Value>\`, \`remove <#>\`, \`clear\`, \`time <0-23>\`, \`mention <Value>\`, \`useEmbed <T/F>\`,`
                )
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }
        if (args[2].toLowerCase() === 'list') {
            this.messageListSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'clear') {
            this.messageClearSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'add' || args[2].toLowerCase() === 'create') {
            this.messageAddSubCommand.execute(args, msg, channel);
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
            this.messageColorSubCommand.execute(args, msg, channel);
        } else {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    `Please specify a sub command for the custom birthday message! [(?)](${Config.links.docs}/faq#what-is-a-custom-birthday-message)\nAccepted Values: \`list\`, \`add <Value>\`, \`remove <#>\`, \`clear\`, \`time <0-23>\`, \`mention <Value>\`, \`useEmbed <T/F>\`,`
                )
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }
    }
}
