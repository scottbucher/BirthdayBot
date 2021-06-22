import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { MessageUtils } from '../utils';
import {
    TrustedRoleAddSubCommand,
    TrustedRoleRemoveSubCommand,
    TrustedRoleClearSubCommand,
    TrustedRoleListSubCommand,
} from './trusted';
import { Lang } from '../services';
import { LangCode } from '../models/enums';

let Config = require('../../config/config.json');

export class TrustedRoleCommand implements Command {
    public name: string = 'trustedrole';
    public aliases = ['tr', 'trusted'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = true;

    constructor(
        private trustedRoleAddSubCommand: TrustedRoleAddSubCommand,
        private trustedRoleRemoveSubCommand: TrustedRoleRemoveSubCommand,
        private trustedRoleClearSubCommand: TrustedRoleClearSubCommand,
        private trustedRoleListSubCommand: TrustedRoleListSubCommand
    ) { }

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
        if (args.length === 2) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.noTrustedRoleArgs', LangCode.EN_US));
            return;
        }
        if (args[2].toLowerCase() === 'add') {
            this.trustedRoleAddSubCommand.execute(args, msg, channel, hasPremium);
        } else if (args[2].toLowerCase() === 'remove') {
            this.trustedRoleRemoveSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'clear') {
            this.trustedRoleClearSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'list') {
            this.trustedRoleListSubCommand.execute(args, msg, channel, hasPremium);
        } else {
            await MessageUtils.send(channel, Lang.getEmbed('validation.noTrustedRoleArgs', LangCode.EN_US));
            return;
        }
    }
}
