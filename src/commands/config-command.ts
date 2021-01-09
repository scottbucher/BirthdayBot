import {
    ConfigBirthdayMasterRoleSubCommand,
    ConfigChannelSubCommand,
    ConfigNameFormatSubCommand,
    ConfigRoleSubCommand,
    ConfigTimezoneSubCommand,
    ConfigTrustedPreventsMsgSubCommand,
    ConfigTrustedPreventsRoleSubCommand,
    ConfigUseTimezoneSubCommand,
} from './config';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { ConfigRequireAllTrustedRolesSubCommand } from './config/config-require-all-trusted-roles-sub-command';
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
        private configRoleSubCommand: ConfigRoleSubCommand,
        private configNameFormatSubCommand: ConfigNameFormatSubCommand,
        private configTrustedPreventsMsgSubCommand: ConfigTrustedPreventsMsgSubCommand,
        private configTrustedPreventsRoleSubCommand: ConfigTrustedPreventsRoleSubCommand,
        private configTimezoneSubCommand: ConfigTimezoneSubCommand,
        private configUseTimezoneSubCommand: ConfigUseTimezoneSubCommand,
        private configRequireAllTrustedRolesSubCommand: ConfigRequireAllTrustedRolesSubCommand
    ) {}

    public async execute(args: string[], msg: Message, channel: TextChannel, hasPremium: boolean) {
        if (args.length === 2) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    `Please specify a config value to change!\n` +
                        `Accepted Values: \`channel\`, \`role\`, \`birthdayMasterRole\`, \`nameFormat\`, \`timezone\`, \`useTimezone\`, \`trustedRole\`, \`trustedPreventsMsg\`, \`trustedPreventsRole\`, \`requireAllTrustedRoles\``
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }
        let subCommand = args[2].toLowerCase();

        if (
            subCommand === 'birthdaymaster' ||
            subCommand === 'birthdaymasterrole' ||
            subCommand === 'master' ||
            subCommand === 'masterrole'
        ) {
            this.configBirthdayMasterRole.execute(args, msg, channel);
        } else if (subCommand === 'channel') {
            this.configChannelSubCommand.execute(args, msg, channel);
        } else if (subCommand === 'role') {
            this.configRoleSubCommand.execute(args, msg, channel);
        } else if (subCommand === 'nameformat') {
            this.configNameFormatSubCommand.execute(args, msg, channel);
        } else if (subCommand === 'timezone') {
            this.configTimezoneSubCommand.execute(args, msg, channel);
        } else if (subCommand === 'usetimezone') {
            this.configUseTimezoneSubCommand.execute(args, msg, channel);
        } else if (
            subCommand === 'trustedpreventsmsg' ||
            subCommand === 'trustedpreventsmessage' ||
            subCommand === 'trustedpreventmsg' ||
            subCommand === 'trustedpreventmessage'
        ) {
            this.configTrustedPreventsMsgSubCommand.execute(args, msg, channel);
        } else if (subCommand === 'trustedpreventsrole' || subCommand === 'trustedpreventrole') {
            this.configTrustedPreventsRoleSubCommand.execute(args, msg, channel);
        } else if (
            subCommand === 'requirealltrustedroles' ||
            subCommand === 'requirealltrusted' ||
            subCommand === 'requireallroles'
        ) {
            this.configRequireAllTrustedRolesSubCommand.execute(args, msg, channel);
        } else {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    `Please specify a config value to change!\n` +
                        `Accepted Values: \`channel\`, \`role\`, \`birthdayMasterRole\`, \`nameFormat\`, \`timezone\`, \`useTimezone\`, \`trustedRole\`, \`trustedPreventsMsg\`, \`trustedPreventsRole\`, \`requireAllTrustedRoles\``
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }
    }
}
