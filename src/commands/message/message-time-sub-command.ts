import { FormatUtils, MessageUtils, ParseUtils } from '../../utils';
import { Message, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

export class MessageTimeSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        // bday message time <type> <0-23>
        let type = args[3]?.toLowerCase();

        if (
            !type ||
            (type !== 'birthday' && type !== 'memberanniversary' && type !== 'serveranniversary')
        ) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidMessageType', LangCode.EN_US)
            );
            return;
        }

        if (args.length < 5) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.noTime', LangCode.EN_US));
            return;
        }

        // Try and get the time
        let messageTime = ParseUtils.parseInt(args[4]);

        if (messageTime !== 0 && (messageTime < 0 || messageTime > 23 || !messageTime)) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidTime', LangCode.EN_US)
            );
            return;
        }

        let timeOutput: string;
        if (messageTime === 0) timeOutput = '12:00 ' + Lang.getRef('terms.amTime', LangCode.EN_US);
        else if (messageTime === 12)
            timeOutput = '12:00 ' + Lang.getRef('terms.pmTime', LangCode.EN_US);
        else if (messageTime < 12)
            timeOutput = messageTime + ':00 ' + Lang.getRef('terms.amTime', LangCode.EN_US);
        else timeOutput = messageTime - 12 + ':00 ' + Lang.getRef('terms.pmTime', LangCode.EN_US);

        let displayType = FormatUtils.getCelebrationDisplayType(type, false).toLowerCase();

        type === 'birthday'
            ? await this.guildRepo.updateBirthdayMessageTime(msg.guild.id, messageTime)
            : type === 'memberanniversary'
            ? await this.guildRepo.updateMemberAnniversaryMessageTime(msg.guild.id, messageTime)
            : await this.guildRepo.updateServerAnniversaryMessageTime(msg.guild.id, messageTime);
        await MessageUtils.send(
            channel,
            Lang.getEmbed('result.setMessageTime', LangCode.EN_US, {
                DISPLAY_TYPE: displayType,
                TIME: timeOutput,
            })
        );
    }
}
