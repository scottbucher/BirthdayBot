import { DiscordAPIError, GuildMember, Message, Role } from 'discord.js';

export abstract class ActionUtils {
    public static async giveRole(member: GuildMember, role: Role): Promise<void> {
        try {
            await member.roles.add(role);
        } catch (error) {
            // Error code 50001: "Missing Access", Error code: 10011: "Unknown Role" (Role was deleted), Error code: 50013: "Missing Permission"
            if (
                error instanceof DiscordAPIError &&
                (error.code === 50001 || error.code === 10011 || error.code === 50013)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async removeRole(member: GuildMember, role: Role): Promise<void> {
        try {
            await member.roles.remove(role);
        } catch (error) {
            // Error code 50001: "Missing Access", Error code: 10011: "Unknown Role" (Role was deleted), Error code: 50013: "Missing Permission"
            if (
                error instanceof DiscordAPIError &&
                (error.code === 50001 || error.code === 10011 || error.code === 50013)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }
}
