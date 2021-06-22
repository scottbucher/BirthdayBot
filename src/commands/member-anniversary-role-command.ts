import {
    MemberAnniversaryRoleAddSubCommand,
    MemberAnniversaryRoleClearSubCommand,
    MemberAnniversaryRoleListSubCommand,
    MemberAnniversaryRoleRemoveSubCommand,
} from './memberAnniversaryRole';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { MessageUtils } from '../utils';
import { Lang } from '../services';
import { LangCode } from '../models/enums';

let Config = require('../../config/config.json');

export class MemberAnniversaryRoleCommand implements Command {
    public name: string = 'memberanniversaryrole';
    public aliases = ['mar', 'memberanniversary', 'anniversaryrole'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = true;
    public getPremium = true;

    constructor(
        private memberAnniversaryRoleAddSubCommand: MemberAnniversaryRoleAddSubCommand,
        private memberAnniversaryRoleRemoveSubCommand: MemberAnniversaryRoleRemoveSubCommand,
        private memberAnniversaryRoleClearSubCommand: MemberAnniversaryRoleClearSubCommand,
        private memberAnniversaryRoleListSubCommand: MemberAnniversaryRoleListSubCommand
    ) { }

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
        if (args.length === 2) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.noMemberAnnviersaryRoleArgs', LangCode.EN_US));
            return;
        }
        if (args[2].toLowerCase() === 'add') {
            this.memberAnniversaryRoleAddSubCommand.execute(args, msg, channel, hasPremium);
        } else if (args[2].toLowerCase() === 'remove') {
            this.memberAnniversaryRoleRemoveSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'clear') {
            this.memberAnniversaryRoleClearSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'list') {
            this.memberAnniversaryRoleListSubCommand.execute(args, msg, channel, hasPremium);
        } else {
            await MessageUtils.send(channel, Lang.getEmbed('validation.noMemberAnnviersaryRoleArgs', LangCode.EN_US));
            return;
        }
    }
}
