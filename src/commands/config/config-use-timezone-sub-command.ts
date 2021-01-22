import { Message, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { MessageUtils } from '../../utils';

const errorEmbed = Lang.getEmbed('validation.invalidUseTimezoneAction', LangCode.EN);

export class ConfigUseTimezoneSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        let option = args[3].toLowerCase();

        if (option !== 'user' && option !== 'server') {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        await this.guildRepo.updateUseTimezone(msg.guild.id, option);
        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.useTimeZoneSettingSet', LangCode.EN, { OPTION: option })
        );
    }
}
