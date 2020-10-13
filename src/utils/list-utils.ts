import { BlacklistRepo, CustomMessageRepo, UserRepo } from '../services/database/repos';
import { Guild, Message } from 'discord.js';

import { FormatUtils } from '.';

let Config = require('../../config/config.json');

export abstract class ListUtils {
    public static async updateBdayList(
        userRepo: UserRepo,
        guild: Guild,
        message: Message,
        page: number
    ): Promise<void> {
        let pageSize = Config.experience.birthdayListSize;

        let users = guild.members.cache.filter(member => !member.user.bot).keyArray();

        let userDataResults = await userRepo.getBirthdayListFull(users, pageSize, page);

        if (page > userDataResults.stats.TotalPages) page = userDataResults.stats.TotalPages;

        let embed = await FormatUtils.getBirthdayListFullEmbed(
            guild,
            userDataResults,
            page,
            pageSize
        );

        message = await message.edit(embed);

        await message.reactions.removeAll();

        if (embed.description === '**No Birthdays in this server!**') return;

        if (page !== 1) await message.react(Config.emotes.previousPage);
        if (userDataResults.stats.TotalPages > 1) await message.react(Config.emotes.jumpToPage);
        if (userDataResults.stats.TotalPages > page) await message.react(Config.emotes.nextPage);
    }

    public static async updateMessageList(
        customMessageRepo: CustomMessageRepo,
        guild: Guild,
        message: Message,
        page: number
    ): Promise<void> {
        let pageSize = Config.experience.birthdayMessageListSize;

        let customMessageResults = await customMessageRepo.getCustomMessageList(
            message.guild.id,
            pageSize,
            page
        );

        if (page > customMessageResults.stats.TotalPages)
            page = customMessageResults.stats.TotalPages;

        let embed = await FormatUtils.getCustomMessageListEmbed(
            guild,
            customMessageResults,
            page,
            pageSize
        );

        message = await message.edit(embed);

        await message.reactions.removeAll();

        if (embed.description === '**No Custom Birthday Messages!**') return;

        if (page !== 1) await message.react(Config.emotes.previousPage);
        if (customMessageResults.stats.TotalPages > 1)
            await message.react(Config.emotes.jumpToPage);
        if (customMessageResults.stats.TotalPages > page)
            await message.react(Config.emotes.nextPage);
    }

    public static async updateBlacklistList(
        blacklistRepo: BlacklistRepo,
        guild: Guild,
        message: Message,
        page: number
    ): Promise<void> {
        let pageSize = Config.experience.blacklistSize;

        let blacklistResults = await blacklistRepo.getBlacklistList(
            message.guild.id,
            pageSize,
            page
        );

        if (page > blacklistResults.stats.TotalPages) page = blacklistResults.stats.TotalPages;

        let embed = await FormatUtils.getBlacklistFullEmbed(
            guild,
            blacklistResults,
            page,
            pageSize
        );

        message = await message.edit(embed);

        await message.reactions.removeAll();

        if (embed.description === '**The blacklist is empty!**') return;

        if (page !== 1) await message.react(Config.emotes.previousPage);
        if (blacklistResults.stats.TotalPages > 1) await message.react(Config.emotes.jumpToPage);
        if (blacklistResults.stats.TotalPages > page) await message.react(Config.emotes.nextPage);
    }
}
