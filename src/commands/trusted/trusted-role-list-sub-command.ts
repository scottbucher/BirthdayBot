import { FormatUtils, MessageUtils, ParseUtils } from '../../utils';
import { Message, TextChannel } from 'discord.js';

import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { TrustedRoleRepo } from '../../services/database/repos/trusted-role-repo';

let Config = require('../../../config/config.json');

export class TrustedRoleListSubCommand {
    constructor(private trustedRoleRepo: TrustedRoleRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel, hasPremium: boolean) {
        let page = 1;

        if (args[3]) {
            try {
                page = ParseUtils.parseInt(args[4]);
            } catch (error) {
                // Not A Number
            }
            if (!page || page <= 0 || page > 100000) page = 1;
        }

        let pageSize = Config.experience.birthdayMessageListSize;

        let trustedRoleResults = await this.trustedRoleRepo.getTrustedRoleList(
            msg.guild.id,
            pageSize,
            page
        );

        if (page > trustedRoleResults.stats.TotalPages) page = trustedRoleResults.stats.TotalPages;

        let embed = await FormatUtils.getTrustedRoleList(
            msg.guild,
            trustedRoleResults,
            page,
            pageSize,
            hasPremium
        );

        let message = await MessageUtils.send(channel, embed);

        if (embed.description === Lang.getRef('list.noTrustedRoles', LangCode.EN)) return;

        await MessageUtils.react(message, Config.emotes.previousPage);
        await MessageUtils.react(message, Config.emotes.jumpToPage);
        await MessageUtils.react(message, Config.emotes.nextPage);
    }
}
