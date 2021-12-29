import {
    CollectorUtils as DjsCollectorUtils,
    ExpireFunction,
    MessageFilter,
    MessageRetriever,
    ReactionFilter,
    ReactionRetriever,
} from 'discord.js-collector-utils';
import { Message, MessageEmbed, MessageReaction, TextBasedChannel, User } from 'discord.js';
import { MessageUtils, PermissionUtils } from '.';

import { Lang } from '../services';

let Config = require('../../config/config.json');

export class CollectorUtils {
    public static createMsgCollect(
        channel: TextBasedChannel,
        user: User,
        expireEmbed?: MessageEmbed
    ): (messageRetriever: MessageRetriever) => Promise<any> {
        let collectFilter: MessageFilter = (nextMsg: Message): boolean =>
            nextMsg.author.id === user.id;

        let stopFilter: MessageFilter = (nextMsg: Message): boolean => {
            // Check if I have permission to send a message
            if (!PermissionUtils.canSendEmbed(channel)) {
                return true;
            }

            // Check if another command was ran, if so cancel the current running setup
            let nextMsgArgs = nextMsg.content.split(' ');
            if (
                [
                    `<@${channel.client.user.id}>`,
                    `<@!${channel.client.user.id}>`,
                    Lang.getCom('keywords.stop'),
                ].includes(nextMsgArgs[0]?.toLowerCase())
            ) {
                return true;
            }

            return false;
        };

        let expireFunction: ExpireFunction = async () => {
            if (!(expireEmbed && PermissionUtils.canSendEmbed(channel))) {
                return;
            }

            await MessageUtils.send(channel, expireEmbed);
        };

        return (messageRetriever: MessageRetriever) =>
            DjsCollectorUtils.collectByMessage(
                channel,
                collectFilter,
                stopFilter,
                messageRetriever,
                expireFunction,
                { time: Config.experience.promptExpireTime * 1000, reset: true }
            );
    }

    public static createReactCollect(
        channel: TextBasedChannel,
        user: User,
        expireEmbed?: MessageEmbed
    ): (msg: Message, reactionRetriever: ReactionRetriever) => Promise<any> {
        let collectFilter: ReactionFilter = (
            msgReaction: MessageReaction,
            reactor: User
        ): boolean => reactor.id === user.id;

        let stopFilter: MessageFilter = (nextMsg: Message): boolean => {
            // Check if I have permission to send a message
            if (!PermissionUtils.canSendEmbed(channel)) {
                return true;
            }

            // Check if another command was ran, if so cancel the current running setup
            let nextMsgArgs = nextMsg.content.split(' ');
            if (
                [
                    `<@${channel.client.user.id}>`,
                    `<@!${channel.client.user.id}>`,
                    Lang.getCom('keywords.stop'),
                ].includes(nextMsgArgs[0]?.toLowerCase())
            ) {
                return true;
            }

            return false;
        };

        let expireFunction: ExpireFunction = async () => {
            if (!(expireEmbed && PermissionUtils.canSendEmbed(channel))) {
                return;
            }

            await MessageUtils.send(channel, expireEmbed);
        };

        return (msg: Message, reactionRetriever: ReactionRetriever) =>
            DjsCollectorUtils.collectByReaction(
                msg,
                collectFilter,
                stopFilter,
                reactionRetriever,
                expireFunction,
                { time: Config.experience.promptExpireTime * 1000, reset: true }
            );
    }
}
