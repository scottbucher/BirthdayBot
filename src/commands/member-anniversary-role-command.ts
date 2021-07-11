import { FormatUtils, MessageUtils, PermissionUtils } from '../utils';
import {
    MemberAnniversaryRoleAddSubCommand,
    MemberAnniversaryRoleClaimSubCommand,
    MemberAnniversaryRoleClearSubCommand,
    MemberAnniversaryRoleListSubCommand,
    MemberAnniversaryRoleRemoveSubCommand,
} from './memberAnniversaryRole';
import { Message, TextChannel } from 'discord.js';

import { Command } from './command';
import { GuildRepo } from '../services/database/repos';
import { Lang } from '../services';
import { LangCode } from '../models/enums';

export class MemberAnniversaryRoleCommand implements Command {
    public name: string = 'memberanniversaryrole';
    public aliases = ['mar', 'memberanniversary', 'anniversaryrole'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = true;
    public getPremium = true;

    constructor(
        private guildRepo: GuildRepo,
        private memberAnniversaryRoleAddSubCommand: MemberAnniversaryRoleAddSubCommand,
        private memberAnniversaryRoleRemoveSubCommand: MemberAnniversaryRoleRemoveSubCommand,
        private memberAnniversaryRoleClearSubCommand: MemberAnniversaryRoleClearSubCommand,
        private memberAnniversaryRoleListSubCommand: MemberAnniversaryRoleListSubCommand,
        private memberAnniversaryRoleClaimSubCommand: MemberAnniversaryRoleClaimSubCommand
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
                Lang.getEmbed('validation.noMemberAnniversaryRoleArgs', LangCode.EN_US)
            );
            return;
        }

        let type = FormatUtils.extractMiscActionType(args[2]?.toLowerCase())?.toLowerCase() ?? '';

        let guildData = await this.guildRepo.getGuild(msg.guild.id);

        if (type === 'claim') {
            this.memberAnniversaryRoleClaimSubCommand.execute(
                args,
                msg,
                channel,
                hasPremium,
                guildData
            );
            return;
        }

        // Check if user has permission
        if (!PermissionUtils.hasSubCommandPermission(msg.member, guildData)) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noPermission', LangCode.EN_US)
            );
            return;
        }

        if (type === 'add') {
            this.memberAnniversaryRoleAddSubCommand.execute(args, msg, channel, hasPremium);
        } else if (type === 'remove') {
            this.memberAnniversaryRoleRemoveSubCommand.execute(args, msg, channel);
        } else if (type === 'clear') {
            this.memberAnniversaryRoleClearSubCommand.execute(args, msg, channel);
        } else if (type === 'list') {
            this.memberAnniversaryRoleListSubCommand.execute(args, msg, channel, hasPremium);
        } else {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noMemberAnniversaryRoleArgs', LangCode.EN_US)
            );
            return;
        }
    }
}
