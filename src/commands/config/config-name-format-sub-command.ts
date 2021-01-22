import { Message, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { MessageUtils } from '../../utils';

export class ConfigNameFormatSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let setting = args[3]?.toLowerCase();
        if (
            setting !== 'mention' &&
            setting !== 'default' &&
            setting !== 'username' &&
            setting !== 'nickname' &&
            setting !== 'tag'
        ) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidNameFormat', LangCode.EN, {
                    MENTION: msg.author.toString(),
                    USERNAME: msg.author.username,
                    NICKNAME: msg.member.displayName,
                    TAG: `${msg.author.username}#${msg.author.discriminator}`,
                })
            );
            return;
        }

        if (setting === 'default') setting = 'mention';

        await this.guildRepo.updateNameFormat(msg.guild.id, setting);

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.nameFormatSet', LangCode.EN, {
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
