import {
    BaseGuildTextChannel,
    Guild,
    GuildMember,
    Message,
    NewsChannel,
    TextBasedChannel,
    TextBasedChannels,
    TextChannel,
    Util,
} from 'discord.js';

import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { channel } from 'diagnostics_channel';

export class GuildUtils {
    public static findMember(guild: Guild, input: string): GuildMember {
        let search = input.toLowerCase();
        return guild.members.cache.find(
            member =>
                member.displayName.toLowerCase().includes(search) ||
                member.user.username.toLowerCase().includes(search) ||
                member.user.id.includes(search)
        );
    }

    public static getRoleName(roleDiscordId: string, guild: Guild): string {
        return roleDiscordId
            ? guild.roles.resolve(roleDiscordId)?.toString() ||
                  `**${Lang.getRef('terms.unknownRole', LangCode.EN_US)}**`
            : `**${Lang.getRef('terms.none', LangCode.EN_US)}**`;
    }

    public static getMemberDisplayName(memberDiscordId: string, guild: Guild): string {
        let displayName = guild.members.resolve(memberDiscordId)?.displayName;
        return displayName ? Util.escapeMarkdown(displayName) : 'Unknown Member';
    }

    public static getMemberMention(memberDiscordId: string, guild: Guild): string {
        return guild.members.resolve(memberDiscordId)?.toString() || 'Unknown Member';
    }

    public static getMentionedTextChannel(msg: Message): BaseGuildTextChannel {
        let textChannel = msg.mentions.channels
            .filter(c => c instanceof TextChannel || c instanceof NewsChannel)
            .first() as BaseGuildTextChannel;

        if (textChannel) return textChannel;

        textChannel = msg.guild.channels.cache
            .filter(channel => channel instanceof TextChannel)
            .map(channel => channel as TextChannel)
            .find(channel => channel.name.toLowerCase().includes(msg.content.toLowerCase()));

        if (textChannel) return textChannel;

        return null;
    }
}
