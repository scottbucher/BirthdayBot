import { RESTJSONErrorCodes as DiscordApiErrors } from 'discord-api-types/v10';
import {
    DiscordAPIError,
    EmojiResolvable,
    Message,
    MessageEditOptions,
    MessageEmbed,
    MessageOptions,
    MessageReaction,
    StartThreadOptions,
    TextBasedChannel,
    ThreadChannel,
    User,
} from 'discord.js';
import { createRequire } from 'node:module';

import { TimeUtils } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

const IGNORED_ERRORS = [
    DiscordApiErrors.UnknownMessage,
    DiscordApiErrors.UnknownChannel,
    DiscordApiErrors.UnknownGuild,
    DiscordApiErrors.UnknownUser,
    DiscordApiErrors.UnknownInteraction,
    DiscordApiErrors.CannotSendMessagesToThisUser, // User blocked bot or DM disabled
    DiscordApiErrors.ReactionWasBlocked, // User blocked bot or DM disabled
];

export class MessageUtils {
    public static async send(
        target: User | TextBasedChannel,
        content: string | MessageEmbed | MessageOptions
    ): Promise<Message> {
        try {
            let options: MessageOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof MessageEmbed
                    ? { embeds: [content] }
                    : content;
            return await target.send(options);
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async reply(
        msg: Message,
        content: string | MessageEmbed | MessageOptions
    ): Promise<Message> {
        try {
            let options: MessageOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof MessageEmbed
                    ? { embeds: [content] }
                    : content;
            return await msg.reply(options);
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async edit(
        msg: Message,
        content: string | MessageEmbed | MessageEditOptions
    ): Promise<Message> {
        try {
            let options: MessageEditOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof MessageEmbed
                    ? { embeds: [content] }
                    : content;
            return await msg.edit(options);
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
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
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async pin(msg: Message): Promise<Message> {
        try {
            return await msg.pin();
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async unpin(msg: Message): Promise<Message> {
        try {
            return await msg.unpin();
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async startThread(
        msg: Message,
        options: StartThreadOptions
    ): Promise<ThreadChannel> {
        try {
            return await msg.startThread(options);
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async delete(msg: Message): Promise<Message> {
        try {
            return await msg.delete();
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    // From pre-update, determine if this is still valid
    public static async sendWithDelay(
        target: User | TextBasedChannel,
        content: string | MessageEmbed | MessageOptions,
        delay?: number
    ): Promise<Message> {
        delay = Config.delays.enabled ? delay : 0;
        try {
            let options: MessageOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof MessageEmbed
                    ? { embeds: [content] }
                    : content;
            await target.send(options);
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
}
