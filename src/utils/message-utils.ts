import {
    DMChannel,
    DiscordAPIError,
    EmojiResolvable,
    Message,
    MessageEmbed,
    MessageReaction,
    StringResolvable,
    TextChannel,
    User,
} from 'discord.js';

let Config = require('../../config/config.json');

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
    public static async edit(target: Message, content: StringResolvable): Promise<Message> {
        try {
            return await target.edit(content);
        } catch (error) {
            // Error code 10008: "Unknown Message" (User blocked bot or DM disabled), Error code 10013: "Unknown User"
            if (
                error instanceof DiscordAPIError &&
                (error.code === 10008 || error.code === 10013)
            ) {
                return;
            } else if (error.code === 50001) {
                // Error code 50001: "Missing Access"
                let embed = new MessageEmbed()
                    .setColor(Config.colors.error)
                    .setDescription('I do not have permission to edit that message!');
                this.send(target.channel as TextChannel, embed);
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

    public static async delete(message: Message): Promise<MessageReaction> {
        try {
            if (message.deletable) await message.delete();
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
