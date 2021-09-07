import { FormatUtils, MessageUtils, PermissionUtils } from '../utils';
import { Message, TextChannel } from 'discord.js';
import { SetupRequired, SetupTrusted } from './setup';

import { Command } from '.';
import { GuildRepo } from '../services/database/repos';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { SetupAnniversary } from './setup/setup-anniversary';

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
    ) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
        // Check for permissions
        if (!PermissionUtils.canReact(channel)) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.needReactAndMessageHistoryPerms', LangCode.EN_US)
            );
            return;
        }

        // Run required setup if no arguments
        if (args.length <= 2) {
            if (
                !msg.guild.me.permissions.has('MANAGE_CHANNELS') ||
                !msg.guild.me.permissions.has('MANAGE_ROLES')
            ) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.needManageChannelsAndRolesPerm', LangCode.EN_US)
                );
                return;
            }

            await this.setupRequired.execute(args, msg, channel);
            return;
        }

        // Required setup is needed to run any specific setup
        let guildData = await this.guildRepo.getGuild(msg.guild.id);
        if (!guildData) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.setupRequired', LangCode.EN_US)
            );
            return;
        }

        let type = FormatUtils.extractMiscActionType(args[2].toLowerCase())?.toLowerCase() ?? '';

        // Run the appropriate setup
        switch (type) {
            case 'anniversary':
                await this.setupAnniversary.execute(args, msg, channel);
                return;
            case 'trusted':
                if (!msg.guild.me.permissions.has('MANAGE_ROLES')) {
                    await MessageUtils.send(
                        channel,
                        Lang.getEmbed('validation.needManageRolesPerm', LangCode.EN_US)
                    );
                    return;
                }
                await this.setupTrusted.execute(args, msg, channel, hasPremium);
                return;
            default:
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.invalidSetupArgs', LangCode.EN_US)
                );
                return;
        }
    }
}
