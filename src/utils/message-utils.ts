import {
    DiscordAPIError,
    DMChannel,
    EmojiResolvable,
    Message,
    MessageEmbed,
    MessageReaction,
    NewsChannel,
    StringResolvable,
    TextChannel,
    User,
} from 'discord.js';

let Config = require('../../config/config.json');

export class MessageUtils {
    public static async send(
        target: User | DMChannel | TextChannel | NewsChannel,
        content: StringResolvable
    ): Promise<Message> {
        try {
            return await target.send(content);
        } catch (error) {
            // 10013: "Unknown user"
            // 50001: "Missing access"
            // 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
            if (error instanceof DiscordAPIError && [10013, 50001, 50007].includes(error.code)) {
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
            if (error instanceof DiscordAPIError) {
                // 10008: "Unknown Message" (User blocked bot or DM disabled)
                // 10013: "Unknown User"
                if ([10008, 10013].includes(error.code)) {
                    return;
                }

                // 50001: "Missing Access"
                if ([50001].includes(error.code)) {
                    let embed = new MessageEmbed()
                        .setColor(Config.colors.error)
                        .setDescription('I do not have permission to edit that message!');
                    this.send(target.channel, embed);
                    return;
                }
            }

            throw error;
        }
    }

    public static async react(msg: Message, emoji: EmojiResolvable): Promise<MessageReaction> {
        try {
            return await msg.react(emoji);
        } catch (error) {
            // 10008: "Unknown Message" (Message was deleted)
            // 90001: "Reaction Blocked" (User blocked bot)
            if (error instanceof DiscordAPIError && [10008, 90001].includes(error.code)) {
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
            return await msgReaction.users.remove(reactor);
        } catch (error) {
            // 10008: "Unknown Message" (Message was deleted)
            // 50001: "Missing Access"
            // 50013: "Missing Permission"
            if (error instanceof DiscordAPIError && [10008, 50001, 50013].includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async delete(message: Message): Promise<Message> {
        try {
            if (message.deletable) {
                return await message.delete();
            }
        } catch (error) {
            // 10008: "Unknown Message" (Message was deleted)
            // 50001: "Missing Access"
            // 50013: "Missing Permission"
            if (error instanceof DiscordAPIError && [10008, 50001, 50013].includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }
}
