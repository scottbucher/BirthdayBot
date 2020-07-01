import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
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

let Config = require('../../config/config.json');

export class MessageCommand implements Command {
    public name: string = 'message';
    public aliases = ['msg'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;

    constructor(
        private messageListSubCommand: MessageListSubCommand,
        private messageClearSubCommand: MessageClearSubCommand,
        private messageAddSubCommand: MessageAddSubCommand,
        private messageRemoveSubCommand: MessageRemoveSubCommand,
        private messageTimeSubCommand: MessageTimeSubCommand,
        private messageMentionSubCommand: MessageMentionSubCommand,
        private messageEmbedSubCommand: MessageEmbedSubCommand,
        private messageTestSubCommand: MessageTestSubCommand
    ) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 2) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    'Please specify what to create!\nAccepted Values: `list`, `add <Value>`, `remove <#>`, `clear`, `time <0-23>`, `mention <Value>`, `useEmbed <T/F>`,'
                )
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }
        if (args[2].toLowerCase() === 'list') {
            this.messageListSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'clear') {
            this.messageClearSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'add') {
            this.messageAddSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'remove') {
            this.messageRemoveSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'time') {
            this.messageTimeSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'mention') {
            this.messageMentionSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'embed') {
            this.messageEmbedSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'test') {
            this.messageTestSubCommand.execute(args, msg, channel);
        }
    }
}
