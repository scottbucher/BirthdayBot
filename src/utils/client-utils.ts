import { DiscordAPIError, Guild, GuildMember, User } from 'discord.js-light';

import { Client } from 'discord.js';
import { RegexUtils } from '.';

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
            // 10013: "Unknown User"
            if (error instanceof DiscordAPIError && [10013].includes(error.code)) {
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
            // 10007: "Unknown Member"
            // 10013: "Unknown User"
            if (error instanceof DiscordAPIError && [10007, 10013].includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }
}
