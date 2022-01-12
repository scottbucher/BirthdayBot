import {
    CommandInteraction,
    Message,
    MessageEmbed,
    MessageReaction,
    TextBasedChannel,
    User,
} from 'discord.js';
import {
    CollectorUtils as DjsCollectorUtils,
    ExpireFunction,
    MessageFilter,
    MessageRetriever,
    ReactionFilter,
    ReactionRetriever,
} from 'discord.js-collector-utils';
import { MessageUtils } from '.';
import { EventData } from '../models';

import { Lang } from '../services';

let Config = require('../../config/config.json');

const trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];
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

    public static async getBooleanFromReact(
        intr: CommandInteraction,
        data: EventData,
        prompt: string | MessageEmbed
    ): Promise<number> {
        let collectReact = CollectorUtils.createReactCollect(intr.user, async () => {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results', 'fail.promptExpired', data.lang())
            );
        });
        let confirmationMessage = await MessageUtils.sendIntr(intr, prompt);
        // Send confirmation and emotes
        for (let option of trueFalseOptions) {
            await MessageUtils.react(confirmationMessage, option);
        }

        return await collectReact(
            confirmationMessage,
            async (msgReaction: MessageReaction, reactor: User) => {
                if (!trueFalseOptions.includes(msgReaction.emoji.name)) return;
                return msgReaction.emoji.name === Config.emotes.confirm ? 1 : 0;
            }
        );
    }
}
