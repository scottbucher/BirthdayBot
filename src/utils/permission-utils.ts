import {
    Channel,
    DMChannel,
    GuildMember,
    NewsChannel,
    Permissions,
    TextBasedChannels,
    TextChannel,
    ThreadChannel,
} from 'discord.js';

import { Command } from '../commands';
import { GuildData } from '../models/database';

let Config = require('../../config/config.json');
export class PermissionUtils {
    public static canSend(channel: Channel, requireReaction = true): boolean {
        if (channel instanceof DMChannel) return true;

        if (
            channel instanceof TextChannel ||
            channel instanceof NewsChannel ||
            channel instanceof ThreadChannel
        ) {
            let channelPerms = channel.permissionsFor(channel.client.user);
            if (!channelPerms) {
                // This can happen if the guild disconnected while a collector is running
                return false;
            }

            // VIEW_CHANNEL - Needed to view the channel
            // SEND_MESSAGES - Needed to send messages
            // EMBED_LINKS - Needed to send embedded links
            // ADD_REACTIONS - Needed to add new reactions to messages
            // READ_MESSAGE_HISTORY - Needed to add new reactions to messages
            //    https://discordjs.guide/popular-topics/permissions-extended.html#implicit-permissions
            return (
                channelPerms.has([
                    Permissions.FLAGS.VIEW_CHANNEL,
                    Permissions.FLAGS.SEND_MESSAGES,
                    Permissions.FLAGS.EMBED_LINKS,
                    Permissions.FLAGS.ADD_REACTIONS,
                ]) &&
                (!requireReaction || channelPerms.has(Permissions.FLAGS.READ_MESSAGE_HISTORY))
            );
        }
    }

    public static canSendEmbed(channel: TextBasedChannels): boolean {
        if (channel instanceof DMChannel) {
            return true;
        } else if (
            channel instanceof TextChannel ||
            channel instanceof NewsChannel ||
            channel instanceof ThreadChannel
        ) {
            let channelPerms = channel.permissionsFor(channel.client.user);
            if (!channelPerms) {
                // This can happen if the guild disconnected while a collector is running
                return false;
            }

            // VIEW_CHANNEL - Needed to view the channel
            // SEND_MESSAGES - Needed to send messages
            // EMBED_LINKS - Needed to send embedded links
            return channelPerms.has([
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.SEND_MESSAGES,
                Permissions.FLAGS.EMBED_LINKS,
            ]);
        } else {
            return false;
        }
    }

    public static canMention(channel: TextBasedChannels): boolean {
        if (channel instanceof DMChannel) {
            return true;
        } else if (
            channel instanceof TextChannel ||
            channel instanceof NewsChannel ||
            channel instanceof ThreadChannel
        ) {
            let channelPerms = channel.permissionsFor(channel.client.user);
            if (!channelPerms) {
                // This can happen if the guild disconnected while a collector is running
                return false;
            }

            // VIEW_CHANNEL - Needed to view the channel
            // MENTION_EVERYONE - Needed to mention @everyone, @here, and all roles
            return channelPerms.has([
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.MENTION_EVERYONE,
            ]);
        } else {
            return false;
        }
    }

    public static canReact(channel: TextBasedChannels, removeOthers: boolean = false): boolean {
        if (channel instanceof DMChannel) {
            return true;
        } else if (
            channel instanceof TextChannel ||
            channel instanceof NewsChannel ||
            channel instanceof ThreadChannel
        ) {
            let channelPerms = channel.permissionsFor(channel.client.user);
            if (!channelPerms) {
                // This can happen if the guild disconnected while a collector is running
                return false;
            }

            // VIEW_CHANNEL - Needed to view the channel
            // ADD_REACTIONS - Needed to add new reactions to messages
            // READ_MESSAGE_HISTORY - Needed to add new reactions to messages
            //    https://discordjs.guide/popular-topics/permissions-extended.html#implicit-permissions
            // MANAGE_MESSAGES - Needed to remove others reactions
            return channelPerms.has([
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.ADD_REACTIONS,
                Permissions.FLAGS.READ_MESSAGE_HISTORY,
                ...(removeOthers ? [Permissions.FLAGS.MANAGE_MESSAGES] : []),
            ]);
        } else {
            return false;
        }
    }

    public static canHandleReaction(channel: TextBasedChannels): boolean {
        // Bot always has permission in direct message
        if (channel instanceof DMChannel) {
            return true;
        } else if (
            channel instanceof TextChannel ||
            channel instanceof NewsChannel ||
            channel instanceof ThreadChannel
        ) {
            let channelPerms = channel.permissionsFor(channel.client.user);
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
    }

    public static hasPermission(
        member: GuildMember,
        guildData: GuildData,
        command?: Command
    ): boolean {
        if (!command || command.adminOnly) {
            if (
                member.permissions.has(Permissions.FLAGS.MANAGE_GUILD) ||
                Config.support.owners.includes(member.id)
            )
                return true;

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

    public static hasSubCommandPermission(member: GuildMember, guildData: GuildData): boolean {
        if (member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) return true;

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
}
