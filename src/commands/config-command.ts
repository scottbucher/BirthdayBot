import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { ConfigBirthdayMasterRoleSubCommand } from './config/config-birthday-master-role-sub-command';
import { ConfigChannelSubCommand } from './config/config-channel-sub-command';
import { ConfigNameFormatSubCommand } from './config/config-name-format-sub-command';
import { ConfigRoleSubCommand } from './config/config-role-sub-command';
import { ConfigTrustedPreventsMsgSubCommand } from './config/config-trusted-prevents-msg-sub-command';
import { ConfigTrustedPreventsRoleSubCommand } from './config/config-trusted-prevents-role-sub-command';
import { ConfigTrustedRoleSubCommand } from './config/config-trusted-role-sub-command';
import { MessageUtils } from '../utils';
import { ConfigTimezoneSubCommand } from './config/config-timezone-sub-command';
import { ConfigUseTimezoneSubCommand } from './config/config-use-timezone-sub-command';

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
        private configRoleSubCommand: ConfigRoleSubCommand,
        private configNameFormatSubCommand: ConfigNameFormatSubCommand,
        private configTrustedRoleSubCommand: ConfigTrustedRoleSubCommand,
        private configTrustedPreventsMsgSubCommand: ConfigTrustedPreventsMsgSubCommand,
        private configTrustedPreventsRoleSubCommand: ConfigTrustedPreventsRoleSubCommand,
        private configTimezoneSubCommand: ConfigTimezoneSubCommand,
        private configUseTimezoneSubCommand: ConfigUseTimezoneSubCommand
    ) {}

    public async execute(args: string[], msg: Message, channel: TextChannel, hasPremium: boolean) {
        if (args.length === 2) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    `Please specify a config value to change!\n` +
                        `Accepted Values: \`channel\`, \`role\`, \`birthdayMasterRole\`, \`nameFormat\`, \`timezone\`, \`useTimezone\`, \`trustedRole\`, \`trustedPreventsMsg\`, \`trustedPreventsRole\``
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
            this.configNameFormatSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'timezone') {
            this.configTimezoneSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'usetimezone') {
            this.configUseTimezoneSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'trustedrole') {
            this.configTrustedRoleSubCommand.execute(args, msg, channel);
        } else if (
            args[2].toLowerCase() === 'trustedpreventsmsg' ||
            args[2].toLowerCase() === 'trustedpreventsmessage' ||
            args[2].toLowerCase() === 'trustedpreventmsg' ||
            args[2].toLowerCase() === 'trustedpreventmessage'
        ) {
            this.configTrustedPreventsMsgSubCommand.execute(args, msg, channel);
        } else if (
            args[2].toLowerCase() === 'trustedpreventsrole' ||
            args[2].toLowerCase() === 'trustedpreventrole'
        ) {
            this.configTrustedPreventsRoleSubCommand.execute(args, msg, channel);
        } else {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    `Please specify a config value to change!\n` +
                        `Accepted Values: \`channel\`, \`role\`, \`birthdayMasterRole\`, \`nameFormat\`, \`timezone\`, \`useTimezone\`, \`trustedRole\`, \`trustedPreventsMsg\`, \`trustedPreventsRole\``
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }
    }
}
