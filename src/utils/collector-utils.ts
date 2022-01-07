import { Message, MessageReaction, TextBasedChannel, User } from 'discord.js';
import {
    CollectorUtils as DjsCollectorUtils,
    ExpireFunction,
    MessageFilter,
    MessageRetriever,
    ReactionFilter,
    ReactionRetriever,
} from 'discord.js-collector-utils';

import { Lang } from '../services';

let Config = require('../../config/config.json');

export class CollectorUtils {
    public static createMsgCollect(
        channel: TextBasedChannel,
        user: User,
        expireFunction?: ExpireFunction
    ): (messageRetriever: MessageRetriever) => Promise<any> {
        let collectFilter: MessageFilter = (nextMsg: Message): boolean =>
            nextMsg.author.id === user.id;

        let stopFilter: MessageFilter = (nextMsg: Message): boolean => {
            // Check if another command was ran, if so cancel the current running setup
            let nextMsgArgs = nextMsg.content.split(' ');
            if ([Lang.getCom('keywords.stop')].includes(nextMsgArgs[0]?.toLowerCase())) {
                return true;
            }

            return false;
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
        user: User,
        expireFunction?: ExpireFunction
    ): (msg: Message, reactionRetriever: ReactionRetriever) => Promise<any> {
        let collectFilter: ReactionFilter = (
            _msgReaction: MessageReaction,
            reactor: User
        ): boolean => reactor.id === user.id;

        let stopFilter: MessageFilter = (nextMsg: Message): boolean => {
            // Check if another command was ran, if so cancel the current running setup
            let nextMsgArgs = nextMsg.content.split(' ');
            if ([Lang.getCom('keywords.stop')].includes(nextMsgArgs[0]?.toLowerCase())) {
                return true;
            }

            return false;
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
