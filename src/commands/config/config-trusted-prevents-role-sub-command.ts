import { FormatUtils, MessageUtils } from '../../utils';
import { Message, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

const errorEmbed = Lang.getEmbed('validation.noTrueFalse', LangCode.EN_US);

export class ConfigTrustedPreventsRoleSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        let preventRole = FormatUtils.findBoolean(args[3]);

        if (preventRole === undefined || preventRole === null) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidTrueFalseTrustedPreventsRole', LangCode.EN_US, {
                    ICON: msg.client.user.displayAvatarURL(),
                })
            );
            return;
        }

        await this.guildRepo.updateTrustedPreventsRole(msg.guild.id, preventRole ? 1 : 0);

        let value = preventRole
            ? 'results.trustedPreventsRoleYes'
            : 'results.trustedPreventsRoleNo';
        await MessageUtils.send(channel, Lang.getEmbed(value, LangCode.EN_US));
    }
}
