import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { MessageUtils, PermissionUtils } from '../utils';
import { SetupRequired, SetupTrusted } from './setup';

import { Command } from '.';
import { GuildRepo } from '../services/database/repos';
import { SetupAnniversary } from './setup/setup-anniversary';
import { Lang } from '../services';
import { LangCode } from '../models/enums';

let Config = require('../../config/config.json');

export class SetupCommand implements Command {
    public name: string = 'setup';
    public aliases = ['configure', 'set-up'];
    public requireSetup = false;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = true;

    constructor(
        private guildRepo: GuildRepo,
        private setupRequired: SetupRequired,
        private setupTrusted: SetupTrusted,
        private setupAnniversary: SetupAnniversary
    ) { }

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
        // Check for permissions
        if (!PermissionUtils.canReact(channel)) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.needReactAndMessageHistoryPerms', LangCode.EN_US));
            return;
        }

        // Run required setup if no arguments
        if (args.length <= 2) {
            if (
                !msg.guild.me.hasPermission('MANAGE_CHANNELS') ||
                !msg.guild.me.hasPermission('MANAGE_ROLES')
            ) {
                await MessageUtils.send(channel, Lang.getEmbed('validation.needManageChannelsAndRolesPerm', LangCode.EN_US));
                return;
            }

            await this.setupRequired.execute(args, msg, channel);
            return;
        }

        // Required setup is needed to run any specific setup
        let guildData = await this.guildRepo.getGuild(msg.guild.id);
        if (!guildData) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.setupRequired', LangCode.EN_US));
            return;
        }

        // Run the appropriate setup
        switch (args[2].toLowerCase()) {
            case 'anniversary':
                await this.setupAnniversary.execute(args, msg, channel);
                return;
            case 'trusted':
                if (!msg.guild.me.hasPermission('MANAGE_ROLES')) {
                    await MessageUtils.send(channel, Lang.getEmbed('validation.needManageRolesPerm', LangCode.EN_US));
                    return;
                }
                await this.setupTrusted.execute(args, msg, channel, hasPremium);
                return;
            default:
                await MessageUtils.send(channel, Lang.getEmbed('validation.invalidSetupArgs', LangCode.EN_US));
                return;
        }
    }
}
