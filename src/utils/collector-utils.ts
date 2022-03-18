import {
    ButtonInteraction,
    CommandInteraction,
    Message,
    MessageActionRow,
    MessageEmbed,
    MessageReaction,
    TextBasedChannel,
    User,
} from 'discord.js';
import {
    ButtonRetriever,
    CollectorUtils as DjsCollectorUtils,
    ExpireFunction,
    MessageRetriever,
    ReactionRetriever,
} from 'discord.js-collector-utils';
import { createRequire } from 'node:module';

import { EventData } from '../models/index.js';
import { Lang } from '../services/index.js';
import { InteractionUtils } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class CollectorUtils {
    public static collectByMessage<T>(
        channel: TextBasedChannel,
        user: User,
        messageRetriever: MessageRetriever<T>,
        expireFunction?: ExpireFunction
    ): Promise<T> {
        return DjsCollectorUtils.collectByMessage(
            channel,
            (nextMsg: Message): boolean => nextMsg.author.id === user.id,
            (nextMsg: Message): boolean => {
                // Check if another command was ran, if so cancel the current running setup
                let nextMsgArgs = nextMsg.content.split(' ');
                if ([Lang.getCom('keywords.stop')].includes(nextMsgArgs[0]?.toLowerCase())) {
                    return true;
                }

                return false;
            },
            messageRetriever,
            expireFunction,
            { time: Config.experience.promptExpireTime * 1000, reset: true }
        );
    }

    public static collectByReaction<T>(
        msg: Message,
        user: User,
        reactionRetriever: ReactionRetriever<T>,
        expireFunction?: ExpireFunction
    ): Promise<T> {
        return DjsCollectorUtils.collectByReaction(
            msg,
            (_msgReaction: MessageReaction, reactor: User): boolean => reactor.id === user.id,
            (nextMsg: Message): boolean => {
                // Check if another command was ran, if so cancel the current running setup
                let nextMsgArgs = nextMsg.content.split(' ');
                if ([Lang.getCom('keywords.stop')].includes(nextMsgArgs[0]?.toLowerCase())) {
                    return true;
                }

                return false;
            },
            reactionRetriever,
            expireFunction,
            { time: Config.experience.promptExpireTime * 1000, reset: true }
        );
    }

    public static collectByButton<T>(
        msg: Message,
        user: User,
        buttonRetriever: ButtonRetriever<T>,
        expireFunction?: ExpireFunction
    ): Promise<{
        intr: ButtonInteraction;
        value: T;
    }> {
        return DjsCollectorUtils.collectByButton(
            msg,
            (intr: ButtonInteraction) => intr.user.id === user.id,
            (nextMsg: Message): boolean => {
                // Check if another command was ran, if so cancel the current running setup
                let nextMsgArgs = nextMsg.content.split(' ');
                if ([Lang.getCom('keywords.stop')].includes(nextMsgArgs[0]?.toLowerCase())) {
                    return true;
                }

                return false;
            },
            buttonRetriever,
            expireFunction,
            { time: Config.experience.promptExpireTime * 1000, reset: true }
        );
    }

    public static async getBooleanFromButton(
        commandIntr: CommandInteraction,
        data: EventData,
        embed: MessageEmbed,
        target?: User
    ): Promise<{ intr: ButtonInteraction; value: boolean }> {
        let prompt = await InteractionUtils.send(commandIntr, {
            embeds: [embed],
            components: [
                {
                    type: 'ACTION_ROW',
                    components: [
                        {
                            type: 'BUTTON',
                            customId: 'true',
                            emoji: Config.emotes.confirm,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: 'false',
                            emoji: Config.emotes.deny,
                            style: 'PRIMARY',
                        },
                    ],
                },
            ],
        });

        if (!prompt) {
            return;
        }

        return await CollectorUtils.collectByButton(
            prompt,
            target ?? commandIntr.user,
            async (intr: ButtonInteraction) => {
                try {
                    await InteractionUtils.deferAndDisableButtons(intr);
                } catch (error) {
                    try {
                        await InteractionUtils.editReply(intr, {
                            components: InteractionUtils.setComponentsStatus(
                                intr.message.components as MessageActionRow[],
                                true
                            ),
                        });
                    } catch (error) {
                        return;
                    }
                    return;
                }

                return {
                    intr,
                    value: intr.customId === 'true',
                };
            },
            async () => {
                await InteractionUtils.send(
                    commandIntr,
                    Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                );
            }
        );
    }

    public static async getSetupChoiceFromButton(
        prevIntr: CommandInteraction | ButtonInteraction,
        data: EventData,
        embed: MessageEmbed
    ): Promise<{ intr: ButtonInteraction; value: string }> {
        let prompt = await InteractionUtils.send(prevIntr, {
            embeds: [embed],
            components: [
                {
                    type: 'ACTION_ROW',
                    components: [
                        {
                            type: 'BUTTON',
                            customId: 'create',
                            emoji: Config.emotes.create,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: 'select',
                            emoji: Config.emotes.select,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: 'deny',
                            emoji: Config.emotes.deny,
                            style: 'PRIMARY',
                        },
                    ],
                },
            ],
        });

        return await CollectorUtils.collectByButton(
            prompt,
            prevIntr.user,
            async (intr: ButtonInteraction) => {
                try {
                    await InteractionUtils.deferAndDisableButtons(intr);
                } catch (error) {
                    try {
                        await InteractionUtils.editReply(intr, {
                            components: InteractionUtils.setComponentsStatus(
                                intr.message.components as MessageActionRow[],
                                true
                            ),
                        });
                    } catch (error) {
                        return;
                    }
                    return;
                }

                return {
                    intr,
                    value: intr.customId,
                };
            },
            async () => {
                await InteractionUtils.send(
                    prevIntr,
                    Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                );
            }
        );
    }
}
