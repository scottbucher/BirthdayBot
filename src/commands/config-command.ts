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
import { Message, TextChannel } from 'discord.js';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { MessageUtils, FormatUtils } from '../utils';

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

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
        if (args.length === 2) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noConfigArgs', LangCode.EN_US)
            );
            return;
        }
        let subCommand = FormatUtils.extractConfigType(args[2].toLowerCase())?.toLowerCase();

        if (!subCommand) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noConfigArgs', LangCode.EN_US)
            );
            return;
        }

        if (subCommand === 'birthdaymasterrole') {
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
        } else if (subCommand === 'trustedpreventsmessage') {
            this.configTrustedPreventsMsgSubCommand.execute(args, msg, channel);
        } else if (subCommand === 'trustedpreventsrole') {
            this.configTrustedPreventsRoleSubCommand.execute(args, msg, channel);
        } else if (subCommand === 'requirealltrustedroles') {
            this.configRequireAllTrustedRolesSubCommand.execute(args, msg, channel);
        } else {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noConfigArgs', LangCode.EN_US)
            );
            return;
        }
    }
}
