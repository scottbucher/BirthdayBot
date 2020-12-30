import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { MessageUtils } from '../utils';
import { TrustedRoleAddSubCommand } from './trusted/trusted-role-add-sub-command';
import { TrustedRoleClearSubCommand } from './trusted/trusted-role-clear-sub-command';
import { TrustedRoleListSubCommand } from './trusted/trusted-role-list-sub-command';
import { TrustedRoleRemoveSubCommand } from './trusted/trusted-role-remove-sub-command';

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
    ) {}

    public async execute(args: string[], msg: Message, channel: TextChannel, hasPremium: boolean) {
        if (args.length === 2) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    `Please specify a sub command!\n` +
                        `Accepted Values: \`add\`, \`remove\`, \`clear\`, \`list\``
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
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
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    `Please specify a sub command!\n` +
                        `Accepted Values: \`add\`, \`remove\`, \`clear\`, \`list\``
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }
    }
}
