import {
    APIActionRowComponent,
    APIMessageActionRowComponent,
    ApplicationCommandOptionChoiceData,
    AutocompleteInteraction,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    CommandInteraction,
    ComponentType,
    DiscordAPIError,
    RESTJSONErrorCodes as DiscordApiErrors,
    EmbedBuilder,
    InteractionReplyOptions,
    InteractionResponse,
    InteractionUpdateOptions,
    Message,
    MessageComponentInteraction,
    ModalSubmitInteraction,
    WebhookEditMessageOptions,
} from 'discord.js';

import { EventData } from '../models/internal-models.js';
import { Lang } from '../services/lang.js';

const IGNORED_ERRORS = [
    DiscordApiErrors.UnknownMessage,
    DiscordApiErrors.UnknownChannel,
    DiscordApiErrors.UnknownGuild,
    DiscordApiErrors.UnknownUser,
    DiscordApiErrors.UnknownInteraction,
    DiscordApiErrors.CannotSendMessagesToThisUser, // User blocked bot or DM disabled
    DiscordApiErrors.ReactionWasBlocked, // User blocked bot or DM disabled
    DiscordApiErrors.MaximumActiveThreads,
];

export class InteractionUtils {
    public static async deferReply(
        intr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        hidden: boolean = true
    ): Promise<InteractionResponse> {
        try {
            return await intr.deferReply({
                ephemeral: hidden,
            });
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async deferUpdate(
        intr: MessageComponentInteraction | ModalSubmitInteraction
    ): Promise<InteractionResponse> {
        try {
            return await intr.deferUpdate();
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async deferAndDisableButtons(intr: ButtonInteraction): Promise<void> {
        await intr.deferUpdate();

        await InteractionUtils.editReply(intr, {
            components: this.setButtonComponentStatus(
                intr.message.components as APIActionRowComponent<APIMessageActionRowComponent>[],
                false
            ),
        });
    }

    public static setButtonComponentStatus(
        rowComponents: APIActionRowComponent<APIMessageActionRowComponent>[],
        enabled: boolean
    ): APIActionRowComponent<APIMessageActionRowComponent>[] {
        rowComponents.forEach(r => {
            r.components.forEach(c => {
                if (c.type === ComponentType.Button)
                    return ButtonBuilder.from(c).setDisabled(enabled);
            });
        });

        return rowComponents;
    }

    public static async send(
        intr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        content: string | EmbedBuilder | InteractionReplyOptions,
        hidden: boolean = true
    ): Promise<Message> {
        try {
            let options: InteractionReplyOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                    ? { embeds: [content] }
                    : content;
            if (intr.deferred || intr.replied) {
                return await intr.followUp({
                    ...options,
                    ephemeral: hidden,
                });
            } else {
                return await intr.reply({
                    ...options,
                    ephemeral: hidden,
                    fetchReply: true,
                });
            }
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async respond(
        intr: AutocompleteInteraction,
        choices: ApplicationCommandOptionChoiceData[] = []
    ): Promise<void> {
        try {
            return await intr.respond(choices);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async sendWithEnterResponseButton(
        intr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        data: EventData,
        embed: EmbedBuilder
    ): Promise<Message<boolean>> {
        return await InteractionUtils.send(intr, {
            embeds: [embed],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            customId: 'enter_response',
                            emoji: '⌨️',
                            label: Lang.getRef('info', 'terms.enterResponse', data.lang),
                            style: ButtonStyle.Primary,
                        },
                    ],
                },
            ],
        });
    }

    public static async editReply(
        intr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        content: string | EmbedBuilder | WebhookEditMessageOptions
    ): Promise<Message> {
        try {
            let options: WebhookEditMessageOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                    ? { embeds: [content] }
                    : content;
            return await intr.editReply(options);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async update(
        intr: MessageComponentInteraction,
        content: string | EmbedBuilder | InteractionUpdateOptions
    ): Promise<Message> {
        try {
            let options: InteractionUpdateOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                    ? { embeds: [content] }
                    : content;
            return await intr.update({
                ...options,
                fetchReply: true,
            });
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }
}
