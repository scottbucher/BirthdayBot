import { GuildMember, Message, Role } from 'discord.js';

export abstract class ActionUtils {
    public static async giveRole(member: GuildMember, role: Role): Promise<void> {
        try {
            await member.roles.add(role);
        } catch (error) {
            // Can't give that role
        }
    }

    public static async removeRole(member: GuildMember, role: Role): Promise<void> {
        try {
            await member.roles.remove(role);
        } catch (error) {
            // Can't take that role
        }
    }
}
