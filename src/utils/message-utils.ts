import {
    DiscordAPIError,
    DMChannel,
    Guild,
    Message,
    StringResolvable,
    TextChannel,
    User,
} from 'discord.js';

export abstract class MessageUtils {
    public static async send(
        target: User | DMChannel | TextChannel,
        content: StringResolvable
    ): Promise<Message> {
        try {
            return await target.send(content);
        } catch (error) {
            // Error code 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
            if (error instanceof DiscordAPIError && error.code === 50007) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static getRoleName(roleDiscordId: string, guild: Guild): string {
        return roleDiscordId
            ? guild.roles.resolve(roleDiscordId)?.toString() || '**Unknown**'
            : '**None**';
    }
}
