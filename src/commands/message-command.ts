import { Message, TextChannel } from 'discord.js';
import {
    MessageAddSubCommand,
    MessageClearSubCommand,
    MessageColorSubCommand,
    MessageEmbedSubCommand,
    MessageListSubCommand,
    MessageMentionSubCommand,
    MessageRemoveSubCommand,
    MessageTestSubCommand,
    MessageTimeSubCommand,
} from './message';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { MessageUtils, FormatUtils } from '../utils';

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
        private messageTestSubCommand: MessageTestSubCommand,
        private messageEmbedSubCommand: MessageEmbedSubCommand,
        private messageColorSubCommand: MessageColorSubCommand
    ) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
        if (args.length === 2) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noCustomMessageArgs', LangCode.EN_US)
            );
            return;
        }

        let type = FormatUtils.extractMiscActionType(args[2]?.toLowerCase())?.toLowerCase() ?? '';

        if (type === 'list') {
            this.messageListSubCommand.execute(args, msg, channel, hasPremium);
        } else if (type === 'clear') {
            this.messageClearSubCommand.execute(args, msg, channel);
        } else if (type === 'add' || args[2].toLowerCase() === 'create') {
            this.messageAddSubCommand.execute(args, msg, channel, hasPremium);
        } else if (type === 'remove' || args[2].toLowerCase() === 'delete') {
            this.messageRemoveSubCommand.execute(args, msg, channel);
        } else if (type === 'time') {
            this.messageTimeSubCommand.execute(args, msg, channel);
        } else if (type === 'mention' || args[2].toLowerCase() === 'role') {
            this.messageMentionSubCommand.execute(args, msg, channel);
        } else if (type === 'test') {
            this.messageTestSubCommand.execute(args, msg, channel);
        } else if (type === 'embed') {
            this.messageEmbedSubCommand.execute(args, msg, channel);
        } else if (type === 'color') {
            this.messageColorSubCommand.execute(args, msg, channel, hasPremium);
        } else {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noCustomMessageArgs', LangCode.EN_US)
            );
            return;
        }
    }
}
