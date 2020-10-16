import { BlacklistRepo, CustomMessageRepo, UserRepo } from '../services/database/repos';
import { Blacklisted, CustomMessages, UserDataResults } from '../models/database';
import { Guild, Message, MessageReaction } from 'discord.js';

import { FormatUtils } from '.';

let Config = require('../../config/config.json');

export abstract class ListUtils {
    public static async updateBdayList(
        userDataResults: UserDataResults,
        guild: Guild,
        message: Message,
        page: number,
        pageSize: number
    ): Promise<void> {
        if (page > userDataResults.stats.TotalPages) page = userDataResults.stats.TotalPages;

        let embed = await FormatUtils.getBirthdayListFullEmbed(
            guild,
            userDataResults,
            page,
            pageSize
        );

        message = await message.edit(embed);

        if (embed.description === '**No Birthdays in this server!**') return;
    }

    public static async updateMessageList(
        customMessageResults: CustomMessages,
        guild: Guild,
        message: Message,
        page: number,
        pageSize: number
    ): Promise<void> {
        if (page > customMessageResults.stats.TotalPages)
            page = customMessageResults.stats.TotalPages;

        let embed = await FormatUtils.getCustomMessageListEmbed(
            guild,
            customMessageResults,
            page,
            pageSize
        );

        message = await message.edit(embed);

        if (embed.description === '**No Custom Birthday Messages!**') return;
    }

    public static async updateBlacklistList(
        blacklistResults: Blacklisted,
        guild: Guild,
        message: Message,
        page: number,
        pageSize: number
    ): Promise<void> {
        if (page > blacklistResults.stats.TotalPages) page = blacklistResults.stats.TotalPages;

        let embed = await FormatUtils.getBlacklistFullEmbed(
            guild,
            blacklistResults,
            page,
            pageSize
        );

        message = await message.edit(embed);

        if (embed.description === '**The blacklist is empty!**') return;
    }
}
