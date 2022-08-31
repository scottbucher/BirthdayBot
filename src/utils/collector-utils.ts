import {
    BaseCommandInteraction,
    ButtonInteraction,
    Message,
    MessageActionRow,
    MessageComponentInteraction,
    MessageEmbed,
    Modal,
    ModalSubmitInteraction,
    SelectMenuInteraction,
    User,
} from 'discord.js';
import {
    ButtonRetriever,
    CollectorUtils as DjsCollectorUtils,
    ExpireFunction,
    ModalRetriever,
    ReactionRetriever,
    SelectMenuRetriever,
} from 'discord.js-collector-utils';
import { createRequire } from 'node:module';

import { EventData } from '../models/index.js';
import { Lang } from '../services/lang.js';
import { InteractionUtils } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class CollectorUtils {
    public static collectByButton<T>(
        msg: Message,
        user: User,
        retriever: ButtonRetriever<T>,
        expireFunc?: ExpireFunction
    ): Promise<{
        intr: ButtonInteraction;
        value: T;
    }> {
        return DjsCollectorUtils.collectByButton(msg, retriever, {
            time: Config.experience.promptExpireTime * 1000,
            reset: true,
            target: user,
            onExpire: expireFunc,
        });
    }

    public static async getBooleanFromButton(
        commandIntr: BaseCommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
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
                            label: Lang.getRef('info', 'boolean.yes', data.lang()),
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: 'false',
                            emoji: Config.emotes.deny,
                            label: Lang.getRef('info', 'boolean.no', data.lang()),
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
        prevIntr: BaseCommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
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
                            label: Lang.getRef('info', 'terms.createNew', data.lang()),
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: 'select',
                            emoji: Config.emotes.select,
                            label: Lang.getRef('info', 'terms.selectExisting', data.lang()),
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: 'deny',
                            emoji: Config.emotes.deny,
                            label: Lang.getRef('info', 'terms.doNotSet', data.lang()),
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

    public static collectBySelectMenu<T>(
        msg: Message,
        user: User,
        retriever: SelectMenuRetriever<T>,
        expireFunc?: ExpireFunction
    ): Promise<{
        intr: SelectMenuInteraction;
        value: T;
    }> {
        return DjsCollectorUtils.collectBySelectMenu(msg, retriever, {
            time: Config.experience.promptExpireTime * 1000,
            reset: true,
            target: user,
            onExpire: expireFunc,
        });
    }

    public static collectByModal<T>(
        msg: Message,
        modal: Modal,
        user: User,
        retriever: ModalRetriever<T>,
        expireFunc?: ExpireFunction
    ): Promise<{
        intr: ModalSubmitInteraction;
        value: T;
    }> {
        return DjsCollectorUtils.collectByModal(msg, modal, retriever, {
            time: Config.experience.promptExpireTime * 1000,
            reset: true,
            target: user,
            onExpire: expireFunc,
        });
    }

    public static collectByReaction<T>(
        msg: Message,
        user: User,
        retriever: ReactionRetriever<T>,
        expireFunc?: ExpireFunction
    ): Promise<T> {
        return DjsCollectorUtils.collectByReaction(msg, retriever, {
            time: Config.experience.promptExpireTime * 1000,
            reset: true,
            target: user,
            onExpire: expireFunc,
        });
    }
}
