import { Message, TextChannel } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos/custom-message-repo';
import { FormatUtils, ParseUtils } from '../../utils';

let Config = require('../../../config/config.json');

export class MessageListSubCommand {
    constructor(private customMessageRepo: CustomMessageRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        let page = 1;

        if (args[3]) {
            try {
                page = ParseUtils.parseInt(args[3]);
            } catch (error) {
                // Not A Number
            }
            if (!page || page <= 0 || page > 100000) page = 1;
        }

        let pageSize = Config.birthdayMessageListSize;

        let customMessageResults = await this.customMessageRepo.getCustomMessageList(
            msg.guild.id,
            pageSize,
            page
        );

        if (page > customMessageResults.stats.TotalPages)
            page = customMessageResults.stats.TotalPages;

        let embed = await FormatUtils.getCustomMessageListEmbed(
            msg.guild,
            customMessageResults,
            page,
            pageSize
        );

        let message = await channel.send(embed);

        if (embed.description === '**No Custom Birthday Messages!**') return;

        if (page !== 1) await message.react(Config.emotes.previousPage);
        if (customMessageResults.stats.TotalPages > page)
            await message.react(Config.emotes.nextPage);
    }
}
