import { FormatUtils, MessageUtils, ParseUtils } from '../../utils';
import { Message, TextChannel } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

let Config = require('../../../config/config.json');

export class MessageListSubCommand {
    constructor(private customMessageRepo: CustomMessageRepo) {}

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

        let type = FormatUtils.extractCelebrationType(args[3]?.toLowerCase());

        if (
            type !== 'birthday' &&
            type !== 'memberanniversary' &&
            type !== 'serveranniversary' &&
            type !== 'userspecificbirthday' &&
            type !== 'userspecificmemberanniversary'
        ) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidMessageType', LangCode.EN_US, {
                    ICON: msg.client.user.displayAvatarURL(),
                })
            );
            return;
        }

        let pageSize = Config.experience.birthdayMessageListSize;

        // Get the correct message list using logic based on the given type
        let customMessageResults =
            type === 'userspecificbirthday' || type === 'userspecificmemberanniversary'
                ? await this.customMessageRepo.getCustomMessageUserList(
                      msg.guild.id,
                      pageSize,
                      page,
                      type === 'userspecificbirthday' ? 'birthday' : 'memberanniversary'
                  )
                : await this.customMessageRepo.getCustomMessageList(
                      msg.guild.id,
                      pageSize,
                      page,
                      type
                  );

        if (page > customMessageResults.stats.TotalPages)
            page = customMessageResults.stats.TotalPages;

        let embed =
            type === 'userspecificbirthday' || type === 'userspecificmemberanniversary'
                ? await FormatUtils.getCustomUserMessageListEmbed(
                      msg.guild,
                      customMessageResults,
                      page,
                      pageSize,
                      hasPremium,
                      type === 'userspecificbirthday' ? 'birthday' : 'memberanniversary'
                  )
                : await FormatUtils.getCustomMessageListEmbed(
                      msg.guild,
                      customMessageResults,
                      page,
                      pageSize,
                      hasPremium,
                      type
                  );

        let message = await MessageUtils.send(channel, embed);

        if (
            embed.description === Lang.getRef('list.noCustomBirthdayMessages', LangCode.EN_US) ||
            embed.description ===
                Lang.getRef('list.noCustomMemberAnniversaryMessages', LangCode.EN_US) ||
            embed.description ===
                Lang.getRef('list.noCustomServerAnniversaryMessages', LangCode.EN_US) ||
            embed.description ===
                Lang.getRef('list.noCustomUserSpecificBirthdayMessages', LangCode.EN_US) ||
            embed.description ===
                Lang.getRef('list.noCustomUserSpecificMemberAnnivesaryMessages', LangCode.EN_US)
        )
            return;

        await MessageUtils.react(message, Config.emotes.previousPage);
        await MessageUtils.react(message, Config.emotes.jumpToPage);
        await MessageUtils.react(message, Config.emotes.nextPage);
    }
}
