import {
    DMChannel,
    DiscordAPIError,
    EmojiResolvable,
    Message,
    MessageEmbed,
    MessageOptions,
    MessageReaction,
    TextBasedChannels,
    TextChannel,
    User,
} from 'discord.js';

import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { TimeUtils } from '.';

let Config = require('../../config/config.json');

export class MessageUtils {
    public static async send(
        target: User | TextBasedChannels,
        content: string | MessageEmbed | MessageOptions
    ): Promise<Message> {
        try {
            let msgOptions = this.messageOptions(content);
            return await target.send(msgOptions);
        } catch (error) {
            // 10003: "Unknown channel"
            // 10004: "Unknown guild"
            // 10013: "Unknown user"
            // 50001: "Missing access"
            // 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
            // 50013: "Missing Permissions"
            if (
                error instanceof DiscordAPIError &&
                [10003, 10004, 10013, 50001, 50007, 50013].includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }
    public static async sendWithDelay(
        target: User | TextBasedChannels,
        content: string | MessageEmbed | MessageOptions,
        delay?: number
    ): Promise<Message> {
        delay = Config.delays.enabled ? delay : 0;
        try {
            let msgOptions = this.messageOptions(content);
            await target.send(msgOptions);
            await TimeUtils.sleep(delay ?? 0);
            return;
        } catch (error) {
            // 10003: "Unknown channel"
            // 10004: "Unknown guild"
            // 10013: "Unknown user"
            // 50001: "Missing access"
            // 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
            // 50013: "Missing Permissions"
            if (
                error instanceof DiscordAPIError &&
                [10003, 10004, 10013, 50001, 50007, 50013].includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }
    public static async reply(
        msg: Message,
        content: string | MessageEmbed | MessageOptions,
        delay?: number
    ): Promise<Message> {
        delay = Config.delays.enabled ? delay : 0;
        try {
            let msgOptions = this.messageOptions(content);
            return await msg.reply(msgOptions);
        } catch (error) {
            // 10003: "Unknown channel"
            // 10004: "Unknown guild"
            // 10013: "Unknown user"
            // 50001: "Missing access"
            // 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
            // 50013: "Missing Permissions"
            if (
                error instanceof DiscordAPIError &&
                [10003, 10004, 10013, 50001, 50007, 50013].includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }
    public static async edit(
        msg: Message,
        content: string | MessageEmbed | MessageOptions
    ): Promise<Message> {
        try {
            let msgOptions = this.messageOptions(content);
            return await msg.edit(msgOptions);
        } catch (error) {
            if (error instanceof DiscordAPIError) {
                // 10008: "Unknown Message" (Message was deleted)
                // 10013: "Unknown User"
                // 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
                // 50013: "Missing Permissions"
                if ([10008, 10013, 50007, 50013].includes(error.code)) {
                    return;
                }

                // 50001: "Missing Access"
                if ([50001].includes(error.code)) {
                    await this.send(
                        msg.channel,
                        Lang.getEmbed('validation.noPermToEdit', LangCode.EN_US)
                    );
                    return;
                }
            }

            throw error;
        }
    }

    public static async react(msg: Message, emoji: EmojiResolvable): Promise<MessageReaction> {
        if (!msg) return;
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
    public static async delete(msg: Message): Promise<Message> {
        try {
            if (msg.deletable) {
                return await msg.delete();
            }
        } catch (error) {
            // 10008: "Unknown Message" (Message was deleted)
            // 50001: "Missing Access"
            // 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
            // 50013: "Missing Permission"
            if (
                error instanceof DiscordAPIError &&
                [10008, 50001, 50007, 50013].includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    private static messageOptions(content: string | MessageEmbed | MessageOptions): MessageOptions {
        let options: MessageOptions = {};
        if (typeof content === 'string') {
            options.content = content;
        } else if (content instanceof MessageEmbed) {
            options.embeds = [content];
        } else {
            options = content;
        }
        return options;
    }
}
