import { Guild, GuildMember } from 'discord.js';

export abstract class GuildUtils {
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
            ? guild.roles.resolve(roleDiscordId)?.toString() || '**Unknown**'
            : '**None**';
    }
}
