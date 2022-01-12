import { RESTJSONErrorCodes as DiscordApiErrors } from 'discord-api-types/rest/v9';
import {
    CommandInteraction,
    DiscordAPIError,
    EmojiResolvable,
    Message,
    MessageEmbed,
    MessageOptions,
    MessageReaction,
    TextBasedChannel,
    User,
} from 'discord.js';

import { TimeUtils } from '.';

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
            let msgOptions = this.messageOptions(content);
            return await target.send(msgOptions);
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async deferIntr(
        intr: CommandInteraction,
        hidden: boolean = false
    ): Promise<void> {
        try {
            return await intr.deferReply({
                ephemeral: hidden,
            });
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async sendIntr(
        intr: CommandInteraction,
        content: string | MessageEmbed | MessageOptions,
        hidden: boolean = false
    ): Promise<Message> {
        try {
            let msgOptions = this.messageOptions(content);
            return (await intr.followUp({
                ...msgOptions,
                ephemeral: hidden,
            })) as Message;
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
            let msgOptions = this.messageOptions(content);
            return await msg.reply(msgOptions);
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
        content: string | MessageEmbed | MessageOptions
    ): Promise<Message> {
        try {
            let msgOptions = this.messageOptions(content);
            return await msg.edit(msgOptions);
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

    // From pre-update, determine if this is still valid
    public static async sendWithDelay(
        target: User | TextBasedChannel,
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
}
