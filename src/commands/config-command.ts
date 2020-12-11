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
import { ConfigBirthdayMasterRoleSubCommand } from './config/config-birthday-master-role-sub-command';
import { ConfigChannelSubCommand } from './config/config-channel-sub-command';
import { ConfigRoleSubCommand } from './config/config-role-sub-command';
import { MessageColorSubCommand } from './message/message-color-sub-command';
import { MessageUserListSubCommand } from './message/message-user-list-sub-command';
import { MessageUtils } from '../utils';

let Config = require('../../config/config.json');

export class ConfigCommand implements Command {
    public name: string = 'config';
    public aliases = ['cf', 'setting'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    constructor(
        private configBirthdayMasterRole: ConfigBirthdayMasterRoleSubCommand,
        private configChannelSubCommand: ConfigChannelSubCommand,
        private configRoleSubCommand: ConfigRoleSubCommand
    ) {}

    public async execute(args: string[], msg: Message, channel: TextChannel, hasPremium: boolean) {
        if (args.length === 2) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    `Please specify a config value to change!\n` +
                        `Accepted Values: \`channel\`, \`role\`, \`birthdayMasterRole\`, \`nameFormat\`, \`timezone\`, \`useTimezone\``
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }
        if (
            args[2].toLowerCase() === 'birthdaymaster' ||
            args[2].toLowerCase() === 'birthdaymasterrole' ||
            args[2].toLowerCase() === 'master' ||
            args[2].toLowerCase() === 'masterrole'
        ) {
            this.configBirthdayMasterRole.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'channel') {
            this.configChannelSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'role') {
            this.configRoleSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'nameformat') {
            // process sub-command
        } else if (args[2].toLowerCase() === 'timezone') {
            // process sub-command
        } else if (args[2].toLowerCase() === 'usetimezone') {
            // process sub-command
        } else {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    `Please specify a config value to change!\n` +
                        `Accepted Values: \`channel\`, \`role\`, \`birthdayMasterRole\`, \`nameFormat\`, \`timezone\`, \`useTimezone\``
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }
    }
}
