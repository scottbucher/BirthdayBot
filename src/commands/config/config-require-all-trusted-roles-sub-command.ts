import { FormatUtils, MessageUtils } from '../../utils';
import { Message, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

const errorEmbed = Lang.getEmbed('validation.noTrueFalse', LangCode.EN_US);

export class ConfigRequireAllTrustedRolesSubCommand {
    constructor(private guildRepo: GuildRepo) { }

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        let requireAll = FormatUtils.findBoolean(args[3]);

        if (requireAll === undefined || requireAll === null) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidTrueFalseRequireAllTrustedMessage', LangCode.EN_US, {
                    ICON: msg.client.user.avatarURL(),
                })
            );
            return;
        }

        await this.guildRepo.updateRequireAllTrustedRoles(msg.guild.id, requireAll ? 1 : 0);

        let value = requireAll ? 'results.requireAllTrustedYes' : 'results.requireAllTrustedNo';
        await MessageUtils.send(channel, Lang.getEmbed(value, LangCode.EN_US));
    }
}
