import { DMChannel, Guild, MessageEmbed } from 'discord.js';

export abstract class MessageUtils {
    public static async sendDm(channel: DMChannel, msg: MessageEmbed | string): Promise<void> {
        try {
            await channel.send(msg);
        } catch (error) {
            // Error code 50007: "Cannot send messages to this user"
            if (error.code === 50007) {
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
