import { DMChannel, GuildChannel, GuildMember, Permissions, TextBasedChannel } from 'discord.js';

import { Command } from 'pm2';
import { GuildData } from '../models/database';

const Config = require('../../config/config.json');
export class PermissionUtils {
    public static canSend(channel: TextBasedChannel, embedLinks: boolean = false): boolean {
        if (channel instanceof DMChannel) {
            return true;
        } else if (channel instanceof GuildChannel) {
            const channelPerms = channel.permissionsFor(channel.client.user);
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
                ...(embedLinks ? [Permissions.FLAGS.EMBED_LINKS] : []),
            ]);
        } else {
            return false;
        }
    }

    public static canMention(channel: TextBasedChannel): boolean {
        if (channel instanceof DMChannel) {
            return true;
        } else if (channel instanceof GuildChannel) {
            const channelPerms = channel.permissionsFor(channel.client.user);
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

    public static canReact(channel: TextBasedChannel, removeOthers: boolean = false): boolean {
        if (channel instanceof DMChannel) {
            return true;
        } else if (channel instanceof GuildChannel) {
            const channelPerms = channel.permissionsFor(channel.client.user);
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

    public static canPin(channel: TextBasedChannel, unpinOld: boolean = false): boolean {
        if (channel instanceof DMChannel) {
            return true;
        } else if (channel instanceof GuildChannel) {
            const channelPerms = channel.permissionsFor(channel.client.user);
            if (!channelPerms) {
                // This can happen if the guild disconnected while a collector is running
                return false;
            }

            // VIEW_CHANNEL - Needed to view the channel
            // MANAGE_MESSAGES - Needed to pin messages
            // READ_MESSAGE_HISTORY - Needed to find old pins to unpin
            return channelPerms.has([
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.MANAGE_MESSAGES,
                ...(unpinOld ? [Permissions.FLAGS.READ_MESSAGE_HISTORY] : []),
            ]);
        } else {
            return false;
        }
    }

    public static hasPermission(member: GuildMember, guildData: GuildData): boolean {
        // Developers, server owners, and members with "Manage Server" have permission for all commands
        if (
            member.guild.ownerId === member.id ||
            member.permissions.has(Permissions.FLAGS.MANAGE_GUILD) ||
            Config.support.owners.includes(member.id)
        ) {
            return true;
        }

        if (guildData) {
            // Check if member has a required role
            const memberRoles = member.roles.cache.map(role => role.id);
            if (
                guildData.BirthdayMasterRoleDiscordId &&
                memberRoles.includes(guildData.BirthdayMasterRoleDiscordId)
            ) {
                return true;
            }
        }
        return true;
    }

    public static hasSubCommandPermission(member: GuildMember, guildData: GuildData): boolean {
        if (member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) return true;

        if (guildData) {
            // Check if member has a required role
            const memberRoles = member.roles.cache.map(role => role.id);
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
