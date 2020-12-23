import { FormatUtils, MessageUtils, ParseUtils } from '../../utils';
import { Message, TextChannel } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

export class MessageUserListSubCommand {
    constructor(private customMessageRepo: CustomMessageRepo) {}

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

        let customMessageResults = await this.customMessageRepo.getCustomMessageUserList(
            msg.guild.id,
            pageSize,
            page,
            'birthday'
        );

        if (page > customMessageResults.stats.TotalPages)
            page = customMessageResults.stats.TotalPages;

        let embed = await FormatUtils.getCustomUserMessageListEmbed(
            msg.guild,
            customMessageResults,
            page,
            pageSize,
            hasPremium
        );

        let message = await MessageUtils.send(channel, embed);

        if (embed.description === '**No Custom Birthday Messages!**') return;

        await MessageUtils.react(message, Config.emotes.previousPage);
        await MessageUtils.react(message, Config.emotes.jumpToPage);
        await MessageUtils.react(message, Config.emotes.nextPage);
    }
}
