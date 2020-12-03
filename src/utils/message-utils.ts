import {
    DMChannel,
    DiscordAPIError,
    EmojiResolvable,
    Message,
    MessageReaction,
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
            // Error code 50007: "Cannot send messages to this user" (User blocked bot or DM disabled), Error code 10013: "Unknown User", Error code 50001: "Missing Access"
            if (
                error instanceof DiscordAPIError &&
                (error.code === 50007 || error.code === 10013 || error.code === 50001)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async react(msg: Message, emoji: EmojiResolvable): Promise<MessageReaction> {
        try {
            return await msg.react(emoji);
        } catch (error) {
            // Error code 90001: "Reaction blocked" (User blocked bot) Error code: 10008: "Unknown Message" (Message was deleted)
            if (
                error instanceof DiscordAPIError &&
                (error.code === 90001 || error.code === 10008)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async removeReaction(
        msgReaction: MessageReaction,
        reactor: User
    ): Promise<MessageReaction> {
        try {
            return msgReaction.users.remove(reactor);
        } catch (error) {
            // Error code 50001: "Missing Access", Error code: 10008: "Unknown Message" (Message was deleted), Error code: 50013: "Missing Permission"
            if (
                error instanceof DiscordAPIError &&
                (error.code === 50001 || error.code === 10008 || error.code === 50013)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }
}
