import { FormatUtils, MessageUtils, ParseUtils } from '../../utils';
import { Message, TextChannel } from 'discord.js';

import { BlacklistRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

let Config = require('../../../config/config.json');

export class BlacklistListSubCommand {
    constructor(private blacklistRepo: BlacklistRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let page = 1;

        if (args[3]) {
            page = ParseUtils.parseInt(args[3]);
            if (!page || page <= 0 || page > 100000) page = 1;
        }

        let pageSize = Config.experience.blacklistSize;

        let blacklistResults = await this.blacklistRepo.getBlacklistList(
            msg.guild.id,
            pageSize,
            page
        );

        if (page > blacklistResults.stats.TotalPages) page = blacklistResults.stats.TotalPages;

        let embed = await FormatUtils.getBlacklistFullEmbed(
            msg.guild,
            blacklistResults,
            page,
            pageSize
        );

        let message = await MessageUtils.send(channel, embed);

        if (embed.description === Lang.getRef('list.emptyBlacklist', LangCode.EN)) return;

        await MessageUtils.react(message, Config.emotes.previousPage);
        await MessageUtils.react(message, Config.emotes.jumpToPage);
        await MessageUtils.react(message, Config.emotes.nextPage);
    }
}
