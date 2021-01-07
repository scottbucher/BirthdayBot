import { GuildUtils, MessageUtils } from '../../utils';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { BlacklistRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

let Config = require('../../../config/config.json');

export class BlacklistAddSubCommand {
    constructor(private blacklistRepo: BlacklistRepo) { }

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 3) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.noUserSpecified', LangCode.EN));
            return;
        }

        // Get who they are mentioning
        let target =
            msg.mentions.members.first()?.user || GuildUtils.findMember(msg.guild, args[3])?.user;

        // Did we find a user?
        if (!target) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.noUserFound', LangCode.EN));
            return;
        }

        if (target.bot) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.cantBlacklistBot', LangCode.EN));
            return;
        }

        let blacklist = await this.blacklistRepo.getBlacklist(msg.guild.id);

        if (blacklist.blacklist.map(entry => entry.UserDiscordId).includes(target.id)) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.userAlreadyInBlacklist', LangCode.EN));
            return;
        }

        await this.blacklistRepo.addBlacklist(msg.guild.id, target.id);

        await MessageUtils.send(channel, Lang.getEmbed('results.blacklistAddSuccess', LangCode.EN, { TARGET: target.toString() }));
    }
}
