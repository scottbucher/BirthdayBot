import { Blacklisted, CustomMessages, UserDataResults } from '../models/database';
import { Guild, Message } from 'discord.js';

import { FormatUtils } from '.';
import { MessageUtils } from './message-utils';

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

        message = await MessageUtils.edit(message, embed);

        if (embed.description === '**No Birthdays in this server!**') {
            await message.reactions.removeAll();
            return;
        }
    }

    public static async updateMessageList(
        customMessageResults: CustomMessages,
        guild: Guild,
        message: Message,
        page: number,
        pageSize: number,
        hasPremium: boolean
    ): Promise<void> {
        if (page > customMessageResults.stats.TotalPages)
            page = customMessageResults.stats.TotalPages;

        let embed = await FormatUtils.getCustomMessageListEmbed(
            guild,
            customMessageResults,
            page,
            pageSize,
            hasPremium,
            'birthday'
        );

        message = await MessageUtils.edit(message, embed);

        if (embed.description === '**No Custom Birthday Messages!**') {
            await message.reactions.removeAll();
            return;
        }
    }

    public static async updateMessageUserList(
        customMessageResults: CustomMessages,
        guild: Guild,
        message: Message,
        page: number,
        pageSize: number,
        hasPremium: boolean
    ): Promise<void> {
        if (page > customMessageResults.stats.TotalPages)
            page = customMessageResults.stats.TotalPages;

        let embed = await FormatUtils.getCustomUserMessageListEmbed(
            guild,
            customMessageResults,
            page,
            pageSize,
            hasPremium
        );

        message = await MessageUtils.edit(message, embed);

        if (embed.description === '**No User-Specific Birthday Messages!**') {
            await message.reactions.removeAll();
            return;
        }
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

        message = await MessageUtils.edit(message, embed);

        if (embed.description === '**The blacklist is empty!**') {
            await message.reactions.removeAll();
            return;
        }
    }
}
