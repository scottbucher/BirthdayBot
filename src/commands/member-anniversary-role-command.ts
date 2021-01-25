import {
    MemberAnniversaryRoleAddSubCommand,
    MemberAnniversaryRoleClearSubCommand,
    MemberAnniversaryRoleListSubCommand,
    MemberAnniversaryRoleRemoveSubCommand,
} from './memberAnniversaryRole';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { MessageUtils } from '../utils';

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
    ) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
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
            this.memberAnniversaryRoleAddSubCommand.execute(args, msg, channel, hasPremium);
        } else if (args[2].toLowerCase() === 'remove') {
            this.memberAnniversaryRoleRemoveSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'clear') {
            this.memberAnniversaryRoleClearSubCommand.execute(args, msg, channel);
        } else if (args[2].toLowerCase() === 'list') {
            this.memberAnniversaryRoleListSubCommand.execute(args, msg, channel, hasPremium);
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
