import { FormatUtils, MessageUtils } from '../../utils';
import { Message, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

const errorEmbed = Lang.getEmbed('validation.noTrueFalse', LangCode.EN_US);

export class ConfigTrustedPreventsMsgSubCommand {
    constructor(private guildRepo: GuildRepo) { }

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        let preventMessage = FormatUtils.findBoolean(args[3]);

        if (preventMessage === undefined || preventMessage === null) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidTrueFalseTrustedPreventsMessage', LangCode.EN_US, {
                    ICON: msg.client.user.avatarURL(),
                })
            );
            return;
        }

        await this.guildRepo.updateTrustedPreventsMessage(msg.guild.id, preventMessage ? 1 : 0);

        let value = preventMessage
            ? 'results.trustedPreventsMessageYes'
            : 'results.trustedPreventsMessageNo';
        await MessageUtils.send(channel, Lang.getEmbed(value, LangCode.EN_US));
    }
}
