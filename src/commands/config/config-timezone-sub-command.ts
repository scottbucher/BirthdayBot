import { FormatUtils, MessageUtils } from '../../utils';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

let Config = require('../../../config/config.json');

const errorEmbed = Lang.getEmbed('validation.noTimeZone', LangCode.EN);
export class ConfigTimezoneSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        if (FormatUtils.checkAbbreviation(args[3])) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidServerTimeZoneAbbreviation', LangCode.EN)
            );
            return;
        }

        let timezone = FormatUtils.findZone(args[3]); // Try and get the time zone
        if (!timezone) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidServerTimeZone', LangCode.EN)
            );
            return;
        }

        await this.guildRepo.updateDefaultTimezone(msg.guild.id, timezone);

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.defaultTimeZoneSet', LangCode.EN, { TIMEZONE: timezone })
        );
    }
}
