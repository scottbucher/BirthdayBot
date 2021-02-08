import { DiscordAPIError, GuildMember, Role } from 'discord.js';

export class ActionUtils {
    public static async giveRole(member: GuildMember, role: Role): Promise<void> {
        try {
            await member.roles.add(role);
        } catch (error) {
            // 10011: "Unknown Role" (Role was deleted)
            // 50001: "Missing Access"
            // 50013: "Missing Permission"
            if (error instanceof DiscordAPIError && [10011, 50001, 50013].includes(error.code)) {
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
            // 10011: "Unknown Role" (Role was deleted)
            // 50001: "Missing Access"
            // 50013: "Missing Permission"
            if (error instanceof DiscordAPIError && [10011, 50001, 50013].includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }
}
