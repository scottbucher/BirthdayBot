import { Message, MessageEmbed, TextChannel } from 'discord.js';

import {
    BlacklistAddSubCommand,
    BlacklistClearSubCommand,
    BlacklistListSubCommand,
    BlacklistRemoveSubCommand,
} from './blacklist';
import { Command } from './command';
import { MessageUtils } from '../utils';
import { Lang } from '../services';
import { LangCode } from '../models/enums';

let Config = require('../../config/config.json');

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
    ) { }

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        if (args.length === 2) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.noBlacklistArgs', LangCode.EN_US));
            return;
        }

        if (args[2].toLowerCase() === 'add') {
            this.blacklistAddSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'remove') {
            this.blacklistRemoveSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'list') {
            this.blacklistListSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'clear') {
            this.blacklistClearSubCommand.execute(args, msg, channel);
        } else {
            await MessageUtils.send(channel, Lang.getEmbed('validation.noBlacklistArgs', LangCode.EN_US));
            return;
        }
    }
}
