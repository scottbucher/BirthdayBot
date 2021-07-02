import {
    BlacklistAddSubCommand,
    BlacklistClearSubCommand,
    BlacklistListSubCommand,
    BlacklistRemoveSubCommand,
} from './blacklist';
import { Message, TextChannel } from 'discord.js';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { MessageUtils, FormatUtils } from '../utils';

export class BlacklistCommand implements Command {
    public name: string = 'blacklist';
    public aliases = ['bl', 'block', 'ban'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    constructor(
        private blacklistAddSubCommand: BlacklistAddSubCommand,
        private blacklistRemoveSubCommand: BlacklistRemoveSubCommand,
        private blacklistClearSubCommand: BlacklistClearSubCommand,
        private blacklistListSubCommand: BlacklistListSubCommand
    ) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        if (args.length === 2) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noBlacklistArgs', LangCode.EN_US)
            );
            return;
        }

        let action = FormatUtils.extractMiscActionType(args[2].toLowerCase())?.toLowerCase() ?? '';

        if (action === 'add') {
            this.blacklistAddSubCommand.execute(args, msg, channel);
        } else if (action === 'remove') {
            this.blacklistRemoveSubCommand.execute(args, msg, channel);
        } else if (action === 'list') {
            this.blacklistListSubCommand.execute(args, msg, channel);
        } else if (action === 'clear') {
            this.blacklistClearSubCommand.execute(args, msg, channel);
        } else {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noBlacklistArgs', LangCode.EN_US)
            );
            return;
        }
    }
}
