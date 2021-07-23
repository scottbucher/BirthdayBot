import { FormatUtils, MessageUtils } from '../../utils';
import { Message, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

export class ConfigDateFormatSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let setting = FormatUtils.extractDateFormatType(args[3]?.toLowerCase())?.toLowerCase();
        if (!setting) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidDateFormat', LangCode.EN_US, {
                    MENTION: msg.author.toString(),
                    USERNAME: msg.author.username,
                    NICKNAME: msg.member.displayName,
                    TAG: `${msg.author.username}#${msg.author.discriminator}`,
                    ICON: msg.client.user.displayAvatarURL(),
                })
            );
            return;
        }

        if (setting === 'default') setting = 'mention';

        await this.guildRepo.updateDateForamt(msg.guild.id, setting);

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.dateFormatSet', LangCode.EN_US, {
                SETTING: setting,
                FORMAT:
                    setting === 'mention'
                        ? msg.author.toString()
                        : setting === 'nickname'
                        ? msg.member.displayName
                        : setting === 'username'
                        ? msg.author.username
                        : `${msg.author.username}#${msg.author.discriminator}`,
            })
        );
    }
}
