import { FormatUtils, MessageUtils, ParseUtils } from '../../utils';
import { Message, TextChannel } from 'discord.js';

import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { MemberAnniversaryRoleRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

export class MemberAnniversaryRoleListSubCommand {
    constructor(private memberAnniversaryRoleRepo: MemberAnniversaryRoleRepo) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
        let page = 1;

        if (args[3]) {
            page = ParseUtils.parseInt(args[4]);
            if (!page || page <= 0 || page > 100000) page = 1;
        }

        let pageSize = Config.experience.birthdayMessageListSize;

        let memberAnniversaryRoleResults = await this.memberAnniversaryRoleRepo.getMemberAnniversaryRoleList(
            msg.guild.id,
            pageSize,
            page
        );

        if (page > memberAnniversaryRoleResults.stats.TotalPages)
            page = memberAnniversaryRoleResults.stats.TotalPages;

        let embed = await FormatUtils.getMemberAnniversaryRoleList(
            msg.guild,
            memberAnniversaryRoleResults,
            page,
            pageSize,
            hasPremium
        );

        let message = await MessageUtils.send(channel, embed);

        if (embed.description === Lang.getRef('list.noMemberAnniversaryRoles', LangCode.EN_US))
            return;

        await MessageUtils.react(message, Config.emotes.previousPage);
        await MessageUtils.react(message, Config.emotes.jumpToPage);
        await MessageUtils.react(message, Config.emotes.nextPage);
    }
}
