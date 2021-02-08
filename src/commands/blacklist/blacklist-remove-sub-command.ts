import { GuildUtils, MessageUtils } from '../../utils';
import { Message, TextChannel } from 'discord.js';

import { BlacklistRepo } from '../../services/database/repos';
import { LangCode } from '../../models/enums';
import { Lang } from '../../services';

export class BlacklistRemoveSubCommand {
    constructor(private blacklistRepo: BlacklistRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        if (args.length === 3) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noUserSpecified', LangCode.EN_US)
            );
            return;
        }

        // Get who they are mentioning
        let target =
            msg.mentions.members.first()?.user || GuildUtils.findMember(msg.guild, args[3])?.user;

        // Did we find a user?
        if (!target) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noUserFound', LangCode.EN_US)
            );
            return;
        }

        if (target.bot) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.cantBlacklistBot', LangCode.EN_US)
            );
            return;
        }

        let blacklist = await this.blacklistRepo.getBlacklist(msg.guild.id);

        if (!blacklist.blacklist.map(entry => entry.UserDiscordId).includes(msg.author.id)) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.userNotInBlacklist', LangCode.EN_US)
            );
            return;
        }

        await this.blacklistRepo.removeBlacklist(msg.guild.id, target.id);

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.blacklistAddSuccess', LangCode.EN_US, {
                TARGET: target.toString(),
            })
        );
    }
}
