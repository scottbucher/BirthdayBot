import {
    ConfigBirthdayMasterRoleSubCommand,
    ConfigChannelSubCommand,
    ConfigNameFormatSubCommand,
    ConfigRequireAllTrustedRolesSubCommand,
    ConfigRoleSubCommand,
    ConfigTimezoneSubCommand,
    ConfigTrustedPreventsMsgSubCommand,
    ConfigTrustedPreventsRoleSubCommand,
    ConfigUseTimezoneSubCommand,
} from './config';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { MessageUtils } from '../utils';
import { Lang } from '../services';
import { LangCode } from '../models/enums';

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
    ) { }

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
        if (args.length === 2) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.noConfigArgs', LangCode.EN_US));
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
            await MessageUtils.send(channel, Lang.getEmbed('validation.noConfigArgs', LangCode.EN_US));
            return;
        }
    }
}
