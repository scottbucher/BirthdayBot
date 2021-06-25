import { Blacklisted, CustomMessages, GuildData, UserDataResults } from '../models/database';
import { FormatUtils, MessageUtils } from '.';
import { Guild, GuildMember, Message, MessageEmbed } from 'discord.js';

import { MemberAnniversaryRoles } from '../models/database/member-anniversary-role-models';
import { TrustedRoles } from '../models/database/trusted-role-models';

export class ListUtils {
    public static async updateBdayList(
        userDataResults: UserDataResults,
        guild: Guild,
        guildData: GuildData,
        message: Message,
        page: number,
        pageSize: number
    ): Promise<void> {
        if (page > userDataResults.stats.TotalPages) page = userDataResults.stats.TotalPages;

        let embed = await FormatUtils.getBirthdayListFullEmbed(
            guild,
            userDataResults,
            guildData,
            page,
            pageSize
        );

        message = await MessageUtils.edit(message, embed);

        if (!embed.title) {
            await message.reactions.removeAll();
            return;
        }
    }
    public static async updateMemberAnniversaryList(
        guildMembers: GuildMember[],
        guild: Guild,
        guildData: GuildData,
        message: Message,
        page: number,
        pageSize: number,
        totalPages: number,
        totalMembers: number
    ): Promise<void> {
        if (page > totalPages) page = totalPages;

        let embed = await FormatUtils.getMemberAnniversaryListFullEmbed(
            guild,
            guildMembers,
            guildData,
            page,
            pageSize,
            totalPages,
            totalMembers
        );

        message = await MessageUtils.edit(message, embed);

        if (!embed.title) {
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
        hasPremium: boolean,
        type: string,
        user: boolean
    ): Promise<void> {
        if (page > customMessageResults.stats.TotalPages)
            page = customMessageResults.stats.TotalPages;

        let embed: MessageEmbed;

        if (user) {
            embed = await FormatUtils.getCustomUserMessageListEmbed(
                guild,
                customMessageResults,
                page,
                pageSize,
                hasPremium,
                type
            );
        } else {
            embed = await FormatUtils.getCustomMessageListEmbed(
                guild,
                customMessageResults,
                page,
                pageSize,
                hasPremium,
                type
            );
        }

        message = await MessageUtils.edit(message, embed);

        if (!embed.title) {
            await message.reactions.removeAll();
            return;
        }
    }

    public static async updateTrustedRoleList(
        trustedRoleResults: TrustedRoles,
        guild: Guild,
        message: Message,
        page: number,
        pageSize: number,
        hasPremium: boolean
    ): Promise<void> {
        if (page > trustedRoleResults.stats.TotalPages) page = trustedRoleResults.stats.TotalPages;

        let embed = await FormatUtils.getTrustedRoleList(
            guild,
            trustedRoleResults,
            page,
            pageSize,
            hasPremium
        );

        message = await MessageUtils.edit(message, embed);

        if (!embed.title) {
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

        if (!embed.title) {
            await message.reactions.removeAll();
            return;
        }
    }

    public static async updateMemberAnniversaryRoleList(
        memberAnniversaryRoleResults: MemberAnniversaryRoles,
        guild: Guild,
        message: Message,
        page: number,
        pageSize: number,
        hasPremium: boolean
    ): Promise<void> {
        if (page > memberAnniversaryRoleResults.stats.TotalPages)
            page = memberAnniversaryRoleResults.stats.TotalPages;

        let embed = await FormatUtils.getMemberAnniversaryRoleList(
            guild,
            memberAnniversaryRoleResults,
            page,
            pageSize,
            hasPremium
        );

        message = await MessageUtils.edit(message, embed);

        if (!embed.title) {
            await message.reactions.removeAll();
            return;
        }
    }
}
