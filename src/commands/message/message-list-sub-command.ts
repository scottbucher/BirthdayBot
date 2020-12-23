import { FormatUtils, MessageUtils, ParseUtils } from '../../utils';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

export class MessageListSubCommand {
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

        let type = args[3]?.toLowerCase();

        if (type !== 'birthday' && type !== 'memberanniversary' && type !== 'serveranniversary') {
            let embed = new MessageEmbed()
                .setTitle('Custom Message List')
                .setDescription(
                    `Please specify a message type! Accepted Values: \`birthday\`, \`memberAnniversary\`, \`serverAnniversary\``
                )
                .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        let pageSize = Config.experience.birthdayMessageListSize;

        let customMessageResults = await this.customMessageRepo.getCustomMessageList(
            msg.guild.id,
            pageSize,
            page,
            type
        );

        if (page > customMessageResults.stats.TotalPages)
            page = customMessageResults.stats.TotalPages;

        let embed = await FormatUtils.getCustomMessageListEmbed(
            msg.guild,
            customMessageResults,
            page,
            pageSize,
            hasPremium,
            type
        );

        let message = await MessageUtils.send(channel, embed);

        if (embed.description === '**No Custom Birthday Messages!**') return;

        await MessageUtils.react(message, Config.emotes.previousPage);
        await MessageUtils.react(message, Config.emotes.jumpToPage);
        await MessageUtils.react(message, Config.emotes.nextPage);
    }
}
