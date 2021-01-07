import { DMChannel, GuildMember, NewsChannel, Permissions, TextChannel } from 'discord.js';

import { Command } from '../commands';
import { GuildData } from '../models/database';

export class PermissionUtils {
    public static canSend(channel: TextChannel | DMChannel | NewsChannel): boolean {
        if (channel instanceof DMChannel) return true;

        let channelPerms = channel?.permissionsFor(channel.client.user);
        if (!channelPerms) {
            // This can happen if the guild disconnected while a collector is running
            return false;
        }
        // VIEW_CHANNEL - Needed to view the channel
        // SEND_MESSAGES - Needed to send messages
        // EMBED_LINKS - Needed to send embedded links
        // ADD_REACTIONS - Needed to add reactions
        return channelPerms.has([
            Permissions.FLAGS.VIEW_CHANNEL,
            Permissions.FLAGS.SEND_MESSAGES,
            Permissions.FLAGS.EMBED_LINKS,
            Permissions.FLAGS.ADD_REACTIONS,
        ]);
    }
    public static canReact(channel: TextChannel | DMChannel | NewsChannel): boolean {
        if (channel instanceof DMChannel) return true;

        let channelPerms = channel?.permissionsFor(channel.client.user);
        if (!channelPerms) {
            // This can happen if the guild disconnected while a collector is running
            return false;
        }

        // VIEW_CHANNEL - Needed to view the channel
        // READ_MESSAGE_HISTORY - Needed to react to old messages
        // ADD_REACTIONS - Needed to add reactions
        return channelPerms.has([
            Permissions.FLAGS.VIEW_CHANNEL,
            Permissions.FLAGS.READ_MESSAGE_HISTORY,
            Permissions.FLAGS.ADD_REACTIONS,
        ]);
    }

    public static canHandleReaction(channel: TextChannel | DMChannel | NewsChannel): boolean {
        if (channel instanceof DMChannel) return true;

        let channelPerms = channel?.permissionsFor(channel.client.user);
        if (!channelPerms) {
            // This can happen if the guild disconnected while a collector is running
            return false;
        }

        // VIEW_CHANNEL - Needed to view the channel
        // READ_MESSAGE_HISTORY - Needed to react to old messages
        return channelPerms.has([
            Permissions.FLAGS.VIEW_CHANNEL,
            Permissions.FLAGS.READ_MESSAGE_HISTORY,
        ]);
    }

    public static hasPermission(
        member: GuildMember,
        guildData: GuildData,
        command?: Command
    ): boolean {
        if (!command || command.adminOnly) {
            if (member.hasPermission(Permissions.FLAGS.ADMINISTRATOR)) return true;

            if (guildData) {
                // Check if member has a required role
                let memberRoles = member.roles.cache.map(role => role.id);
                if (
                    guildData.BirthdayMasterRoleDiscordId &&
                    memberRoles.includes(guildData.BirthdayMasterRoleDiscordId)
                ) {
                    return true;
                }
            }
            return false;
        }
        return true;
    }
}
