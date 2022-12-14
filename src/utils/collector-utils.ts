import {
    AnySelectMenuInteraction,
    APIActionRowComponent,
    APIMessageActionRowComponent,
    ButtonInteraction,
    ButtonStyle,
    CommandInteraction,
    ComponentType,
    EmbedBuilder,
    Message,
    MessageComponentInteraction,
    ModalBuilder,
    ModalSubmitInteraction,
    TextBasedChannel,
    User,
} from 'discord.js';
import {
    ButtonRetriever,
    CollectorUtils as DjsCollectorUtils,
    ExpireFunction,
    MessageRetriever,
    ModalRetriever,
    ReactionRetriever,
    SelectMenuRetriever,
} from 'discord.js-collector-utils';
import { createRequire } from 'node:module';

import { EventData } from '../models/index.js';
import { Lang } from '../services/index.js';
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

    public static collectBySelectMenu<T>(
        msg: Message,
        user: User,
        retriever: SelectMenuRetriever<T>,
        expireFunc?: ExpireFunction
    ): Promise<{
        intr: AnySelectMenuInteraction;
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
        modal: ModalBuilder,
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

    public static collectByMessage<T>(
        channel: TextBasedChannel,
        user: User,
        retriever: MessageRetriever<T>,
        expireFunc?: ExpireFunction
    ): Promise<T> {
        return DjsCollectorUtils.collectByMessage(channel, retriever, {
            time: Config.experience.promptExpireTime * 1000,
            reset: true,
            target: user,
            onExpire: expireFunc,
        });
    }

    public static async getBooleanFromButton(
        commandIntr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        data: EventData,
        embed: EmbedBuilder,
        target?: User
    ): Promise<{ intr: ButtonInteraction; value: boolean }> {
        let prompt = await InteractionUtils.send(commandIntr, {
            embeds: [embed],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            customId: 'true',
                            emoji: Config.emotes.confirm,
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: ComponentType.Button,
                            customId: 'false',
                            emoji: Config.emotes.deny,
                            style: ButtonStyle.Primary,
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
                                intr.message
                                    .components as APIActionRowComponent<APIMessageActionRowComponent>[],
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
        embed: EmbedBuilder
    ): Promise<{ intr: ButtonInteraction; value: string }> {
        let prompt = await InteractionUtils.send(prevIntr, {
            embeds: [embed],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            customId: 'create',
                            emoji: Config.emotes.create,
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: ComponentType.Button,
                            customId: 'select',
                            emoji: Config.emotes.select,
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: ComponentType.Button,
                            customId: 'deny',
                            emoji: Config.emotes.deny,
                            style: ButtonStyle.Primary,
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
                                intr.message
                                    .components as APIActionRowComponent<APIMessageActionRowComponent>[],
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
