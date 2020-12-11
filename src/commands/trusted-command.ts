import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { MessageUtils } from '../utils';
import { TrustedPreventMsgSubCommand } from './trusted/trusted-prevent-msg-sub-command';
import { TrustedPreventRoleSubCommand } from './trusted/trusted-prevent-role-sub-command';
import { TrustedRoleSubCommand } from './trusted/trusted-role-sub-command';

let Config = require('../../config/config.json');

export class TrustedCommand implements Command {
    public name: string = 'trusted';
    public aliases = ['important'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    constructor(
        private trustedRoleSubCommand: TrustedRoleSubCommand,
        private trustedPreventMsgSubCommand: TrustedPreventMsgSubCommand,
        private trustedPreventRoleSubCommand: TrustedPreventRoleSubCommand
    ) {}

    public async execute(args: string[], msg: Message, channel: TextChannel, hasPremium: boolean) {
        if (args.length === 2) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    `Please specify a config value to change!\n` +
                        `Accepted Values: \`role\`, \`preventMsg\`, \`preventRole\``
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }
        if (args[2].toLowerCase() === 'role') {
            this.trustedRoleSubCommand.execute(args, msg, channel);
        } else if (
            args[2].toLowerCase() === 'preventmsg' ||
            args[2].toLowerCase() === 'preventmessage'
        ) {
            this.trustedPreventMsgSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'preventrole') {
            this.trustedPreventRoleSubCommand.execute(args, msg, channel);
        } else {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    `Please specify a config value to change!\n` +
                        `Accepted Values: \`role\`, \`preventMsg\`, \`preventRole\``
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }
    }
}
