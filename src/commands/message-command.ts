import { Message, MessageEmbed, TextChannel } from 'discord.js';
import {
    MessageAddSubCommand,
    MessageClearSubCommand,
    MessageListSubCommand,
    MessageMentionSubCommand,
    MessageRemoveSubCommand,
    MessageTestSubCommand,
    MessageTimeSubCommand,
} from './message';

import { Command } from './command';
import { MessageUtils } from '../utils';
import { Lang } from '../services';
import { LangCode } from '../models/enums';

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
        private messageTestSubCommand: MessageTestSubCommand
    ) { }

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
        if (args.length === 2) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.noCustomMessageArgs', LangCode.EN_US));
            return;
        }
        if (args[2].toLowerCase() === 'list') {
            this.messageListSubCommand.execute(args, msg, channel, hasPremium);
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
        } else if (args[2].toLowerCase() === 'test') {
            this.messageTestSubCommand.execute(args, msg, channel);
        } else {
            await MessageUtils.send(channel, Lang.getEmbed('validation.noCustomMessageArgs', LangCode.EN_US));
            return;
        }
    }
}
