import { DMChannel, Permissions, TextChannel } from 'discord.js';

export abstract class PermissionUtils {
    public static canSend(channel: TextChannel | DMChannel): boolean {
        if (channel instanceof DMChannel) return true;

        let channelPerms = channel?.permissionsFor(channel.client.user);
        if (!channelPerms) {
            // This can happen if the guild disconnected while a collector is running
            return false;
        }
        // VIEW_CHANNEL - Needed to view the channel
        // SEND_MESSAGES - Needed to send messages
        // EMBED_LINKS - Needed to send embedded links
        return channel
            .permissionsFor(channel.client.user)
            .has([
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.SEND_MESSAGES,
                Permissions.FLAGS.EMBED_LINKS,
                Permissions.FLAGS.ADD_REACTIONS,
            ]);
    }
    public static canReact(channel: TextChannel | DMChannel): boolean {
        if (channel instanceof DMChannel) return true;

        let channelPerms = channel?.permissionsFor(channel.client.user);
        if (!channelPerms) {
            // This can happen if the guild disconnected while a collector is running
            return false;
        }

        return channel
            .permissionsFor(channel.client.user)
            .has([Permissions.FLAGS.ADD_REACTIONS, Permissions.FLAGS.READ_MESSAGE_HISTORY]);
    }

    public static canHandleReaction(channel: TextChannel): boolean {
        let channelPerms = channel?.permissionsFor(channel.client.user);
        if (!channelPerms) {
            // This can happen if the guild disconnected while a collector is running
            return false;
        }

        return channel
            .permissionsFor(channel.client.user)
            .has([Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.READ_MESSAGE_HISTORY]);
    }
}
