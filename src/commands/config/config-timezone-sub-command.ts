import { FormatUtils, MessageUtils } from '../../utils';
import { Message, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

const errorEmbed = Lang.getEmbed('validation.noTimeZone', LangCode.EN_US);
export class ConfigTimezoneSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        if (FormatUtils.extractMiscActionType(args[3])) {
            await this.guildRepo.updateDefaultTimezone(msg.guild.id, '0');

            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.defaultTimeCleared', LangCode.EN_US)
            );
            return;
        }

        if (FormatUtils.checkAbbreviation(args[3])) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidServerTimeZoneAbbreviation', LangCode.EN_US, {
                    ICON: msg.client.user.displayAvatarURL(),
                })
            );
            return;
        }

        let timezone = FormatUtils.findZone(args[3]); // Try and get the time zone
        if (!timezone) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidServerTimeZone', LangCode.EN_US, {
                    ICON: msg.client.user.displayAvatarURL(),
                })
            );
            return;
        }

        await this.guildRepo.updateDefaultTimezone(msg.guild.id, timezone);

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.defaultTimeZoneSet', LangCode.EN_US, { TIMEZONE: timezone })
        );
    }
}
