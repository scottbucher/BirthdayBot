import { RESTJSONErrorCodes as DiscordApiErrors } from 'discord-api-types/rest/v9';
import {
    AnyChannel,
    Client,
    NewsChannel,
    DiscordAPIError,
    Guild,
    GuildMember,
    TextChannel,
    User,
    Role,
} from 'discord.js';

import { LangCode } from '../models/enums/index.js';
import { PermissionUtils, RegexUtils } from './index.js';

const FETCH_MEMBER_LIMIT = 20;

export class ClientUtils {
    public static async getUser(client: Client, discordId: string): Promise<User> {
        discordId = RegexUtils.discordId(discordId);
        if (!discordId) {
            return;
        }

        try {
            return await client.users.fetch(discordId);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                [DiscordApiErrors.UnknownUser].includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async findMember(guild: Guild, input: string): Promise<GuildMember> {
        try {
            let discordId = RegexUtils.discordId(input);
            if (discordId) {
                return await guild.members.fetch(discordId);
            }

            let tag = RegexUtils.tag(input);
            if (tag) {
                return (
                    await guild.members.fetch({ query: tag.username, limit: FETCH_MEMBER_LIMIT })
                ).find(member => member.user.discriminator === tag.discriminator);
            }

            return (await guild.members.fetch({ query: input, limit: 1 })).first();
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                [DiscordApiErrors.UnknownMember, DiscordApiErrors.UnknownUser].includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async getChannel(client: Client, discordId: string): Promise<AnyChannel> {
        discordId = RegexUtils.discordId(discordId);
        if (!discordId) {
            return;
        }

        try {
            return await client.channels.fetch(discordId);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                [DiscordApiErrors.UnknownChannel].includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async findRole(guild: Guild, input: string): Promise<Role> {
        try {
            let discordId = RegexUtils.discordId(input);
            if (discordId) {
                return await guild.roles.fetch(discordId);
            }

            return guild.roles.cache.find(r => r.name.toLowerCase().includes(input));
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                [DiscordApiErrors.UnknownRole].includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async findNotifyChannel(
        guild: Guild,
        _langCode: LangCode
    ): Promise<TextChannel | NewsChannel> {
        // Prefer the system channel
        let systemChannel = guild.systemChannel;
        if (systemChannel && PermissionUtils.canSend(systemChannel)) {
            return systemChannel;
        }

        // Otherwise look for a bot channel
        return (await guild.channels.fetch()).find(
            channel =>
                (channel instanceof TextChannel || channel instanceof NewsChannel) &&
                PermissionUtils.canSend(channel)
        ) as TextChannel | NewsChannel;
    }
}
