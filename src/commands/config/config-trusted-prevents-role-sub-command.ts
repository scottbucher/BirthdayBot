import { FormatUtils, MessageUtils } from '../../utils';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

let Config = require('../../../config/config.json');

const errorEmbed = Lang.getEmbed('validation.noTrueFalse', LangCode.EN);

export class ConfigTrustedPreventsRoleSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        let preventRole = FormatUtils.findBoolean(args[3]);

        if (preventRole === undefined || preventRole === null) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidTrueFalseTrustedPreventsRole', LangCode.EN)
            );
            return;
        }

        await this.guildRepo.updateTrustedPreventsRole(msg.guild.id, preventRole ? 1 : 0);

        let value = preventRole
            ? 'results.trustedPreventsRoleYes'
            : 'results.trustedPreventsRoleNo';
        await MessageUtils.send(channel, Lang.getEmbed(value, LangCode.EN));
    }
}
