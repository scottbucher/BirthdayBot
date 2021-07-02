import { FormatUtils, MessageUtils } from '../utils';
import { Message, TextChannel } from 'discord.js';
import {
    TrustedRoleAddSubCommand,
    TrustedRoleClearSubCommand,
    TrustedRoleListSubCommand,
    TrustedRoleRemoveSubCommand,
} from './trusted';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';

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
                Lang.getEmbed('validation.noTrustedRoleArgs', LangCode.EN_US)
            );
            return;
        }

        let action = FormatUtils.extractMiscActionType(args[2].toLowerCase())?.toLowerCase() ?? '';

        if (action === 'add') {
            this.trustedRoleAddSubCommand.execute(args, msg, channel, hasPremium);
        } else if (action === 'remove') {
            this.trustedRoleRemoveSubCommand.execute(args, msg, channel);
        } else if (action === 'clear') {
            this.trustedRoleClearSubCommand.execute(args, msg, channel);
        } else if (action === 'list') {
            this.trustedRoleListSubCommand.execute(args, msg, channel, hasPremium);
        } else {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noTrustedRoleArgs', LangCode.EN_US)
            );
            return;
        }
    }
}
