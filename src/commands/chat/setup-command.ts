import {
    ChannelType,
    ChatInputCommandInteraction,
    CommandInteraction,
    ComponentType,
    MessageComponentInteraction,
    ModalBuilder,
    ModalSubmitInteraction,
    PermissionsString,
    TextBasedChannel,
    TextInputStyle,
} from 'discord.js';
import { ExpireFunction } from 'discord.js-collector-utils';
import { createRequire } from 'node:module';

import { GuildData } from '../../database/entities/guild.js';
import { DataValidation, EventDataType } from '../../enums/index.js';
import { Language } from '../../models/enum-helpers/language.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import {
    ClientUtils,
    CollectorUtils,
    InteractionUtils,
    PermissionUtils,
} from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');

export class SetupCommand implements Command {
    public names = [Lang.getRef('commands', 'chatCommands.setup', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireDev = false;
    public requireClientPerms: PermissionsString[] = [
        'ViewChannel',
        'ManageRoles',
        'ManageChannels',
    ];
    public requireSetup = false;
    public requireVote = false;
    public requireEventData: EventDataType[] = [];
    public dataValidation: DataValidation[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let guild = intr.guild;
        let guildData = data.guildData;

        let birthdayChannel: string;
        let birthdayRole: string;

        let nextIntr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction =
            intr;
        let expireFunction: ExpireFunction = async () => {
            await InteractionUtils.send(
                nextIntr,
                Lang.getEmbed('results', 'fail.promptExpired', data.lang)
            );
        };

        let channelEmbed = Lang.getEmbed('prompts', 'setup.birthdayChannel', data.lang, {
            ICON: intr.client.user.displayAvatarURL(),
        }).setAuthor({ name: `${guild.name}`, url: guild.iconURL() });

        let channelResult = await CollectorUtils.getSetupChoiceFromButton(
            nextIntr,
            data,
            channelEmbed
        );

        if (channelResult === undefined) return;

        switch (channelResult.value) {
            case 'create': {
                // Create channel with desired attributes
                let botRoleId = guild.members.me.roles.cache
                    .filter(role => role.managed)
                    ?.first()?.id;
                if (!botRoleId) {
                    await InteractionUtils.send(
                        nextIntr,
                        Lang.getErrorEmbed('validation', 'errorEmbeds.noBotRole', data.lang)
                    );
                    return;
                }
                birthdayChannel = (
                    await guild.channels.create({
                        type: ChannelType.GuildText,
                        name: Lang.getRef('info', 'defaults.birthdayChannelName', data.lang),
                        topic: Lang.getRef('info', 'defaults.birthdayChannelTopic', data.lang),
                        permissionOverwrites: [
                            {
                                id: guild.id,
                                deny: ['SendMessages'],
                                allow: ['ViewChannel'],
                            },
                            {
                                id: botRoleId,
                                allow: [
                                    'ViewChannel',
                                    'SendMessages',
                                    'EmbedLinks',
                                    'AddReactions',
                                    'ReadMessageHistory',
                                ],
                            },
                        ],
                    })
                )?.id;
                break;
            }
            case 'select': {
                let channelPrompt = await InteractionUtils.sendWithEnterResponseButton(
                    nextIntr,
                    data,
                    Lang.getEmbed('prompts', 'setup.inputChannel', data.lang)
                );

                let channelResult = await CollectorUtils.collectByModal(
                    channelPrompt,
                    new ModalBuilder({
                        customId: 'modal', // Will be overwritten
                        title: Lang.getRef('info', 'terms.birthdayChannel', data.lang),
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.TextInput,
                                        customId: 'birthday',
                                        label: Lang.getRef(
                                            'info',
                                            'terms.birthdayChannel',
                                            data.lang
                                        ),
                                        required: true,
                                        style: TextInputStyle.Short,
                                        minLength: 1,
                                        placeholder: `#${Lang.getRef(
                                            'info',
                                            'defaults.birthdayChannelName',
                                            data.lang
                                        )}`,
                                    },
                                ],
                            },
                        ],
                    }),
                    intr.user,
                    async (intr: ModalSubmitInteraction) => {
                        let textInput = intr.components[0].components[0];
                        if (textInput.type !== ComponentType.TextInput) {
                            return;
                        }

                        // Find mentioned channel
                        let givenChannel: TextBasedChannel = await ClientUtils.findTextChannel(
                            intr.guild,
                            textInput.value
                        );

                        if (!givenChannel) {
                            await InteractionUtils.send(
                                intr,
                                Lang.getErrorEmbed(
                                    'validation',
                                    'errorEmbeds.invalidChannel',
                                    data.lang
                                )
                            );
                            return;
                        }

                        // Bot needs to be able to message in the desired channel
                        if (!PermissionUtils.canSend(givenChannel)) {
                            await InteractionUtils.send(
                                intr,
                                Lang.getEmbed('validation', 'embeds.noAccessToChannel', data.lang, {
                                    CHANNEL: givenChannel.toString(),
                                })
                            );
                            return;
                        }

                        return { intr, value: givenChannel?.id };
                    },
                    expireFunction
                );

                if (channelResult === undefined) return;
                nextIntr = channelResult.intr;
                birthdayChannel = channelResult.value;

                break;
            }
            case 'deny': {
                birthdayChannel = undefined;
                break;
            }
        }

        let roleEmbed = Lang.getEmbed('prompts', 'setup.birthdayRole', data.lang, {
            ICON: intr.client.user.displayAvatarURL(),
        }).setAuthor({ name: `${guild.name}`, url: guild.iconURL() });

        let roleResult = await CollectorUtils.getSetupChoiceFromButton(nextIntr, data, roleEmbed);

        if (roleResult === undefined) return;

        switch (roleResult.value) {
            case 'create': {
                // Create role with desired attributes
                birthdayRole = (
                    await guild.roles.create({
                        name: Config.emotes.birthday,
                        color: Config.colors.role,
                        hoist: true,
                        mentionable: true,
                    })
                )?.id;
                break;
            }
            case 'select': {
                let rolePrompt = await InteractionUtils.sendWithEnterResponseButton(
                    nextIntr,
                    data,
                    Lang.getEmbed('prompts', 'setup.inputRole', data.lang)
                );

                let roleResult = await CollectorUtils.collectByModal(
                    rolePrompt,
                    new ModalBuilder({
                        customId: 'modal', // Will be overwritten
                        title: Lang.getRef('info', 'terms.birthdayRole', data.lang),
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.TextInput,
                                        customId: 'role',
                                        label: Lang.getRef('info', `terms.birthdayRole`, data.lang),
                                        required: true,
                                        style: TextInputStyle.Short,
                                        minLength: 1,
                                        placeholder: `@${Config.emotes.birthday}`,
                                    },
                                ],
                            },
                        ],
                    }),
                    intr.user,
                    async (intr: ModalSubmitInteraction) => {
                        let textInput = intr.components[0].components[0];
                        if (textInput.type !== ComponentType.TextInput) {
                            return;
                        }

                        if (textInput.value.toLowerCase() === 'none') {
                            return { intr, value: 'none' };
                        } else {
                            // Find mentioned role
                            let birthdayRoleInput = await ClientUtils.findRole(
                                intr.guild,
                                textInput.value
                            );

                            // If it couldn't find the role, the role was in another guild, or the role the everyone role
                            if (
                                !birthdayRoleInput ||
                                birthdayRoleInput.id === guild.id ||
                                textInput.value.toLowerCase() === 'everyone'
                            ) {
                                InteractionUtils.send(
                                    intr,
                                    Lang.getErrorEmbed(
                                        'validation',
                                        'errorEmbeds.invalidRole',
                                        data.lang
                                    )
                                );
                                return;
                            }

                            // Check the role's position
                            if (
                                birthdayRoleInput.position >
                                guild.members.resolve(intr.client.user).roles.highest.position
                            ) {
                                await InteractionUtils.send(
                                    intr,
                                    Lang.getEmbed(
                                        'validation',
                                        'embeds.roleHierarchyError',
                                        data.lang,
                                        {
                                            BOT: intr.client.user.toString(),
                                            ICON: intr.client.user.displayAvatarURL(),
                                        }
                                    )
                                );
                                return;
                            }

                            // Check if the role is managed
                            if (birthdayRoleInput.managed) {
                                InteractionUtils.send(
                                    intr,
                                    Lang.getErrorEmbed(
                                        'validation',
                                        'errorEmbeds.birthdayRoleManaged',
                                        data.lang
                                    )
                                );
                                return;
                            }

                            let membersWithRole = birthdayRoleInput.members.size;

                            if (membersWithRole > 0 && membersWithRole < 100) {
                                await InteractionUtils.send(
                                    intr,
                                    Lang.getEmbed(
                                        'validation',
                                        'embeds.birthdayRoleUsedWarning',
                                        data.lang,
                                        {
                                            AMOUNT: membersWithRole.toString(),
                                            S_Value: membersWithRole > 1 ? 's' : '',
                                            ICON: intr.client.user.displayAvatarURL(),
                                        }
                                    )
                                );
                            } else if (membersWithRole > 100) {
                                await InteractionUtils.send(
                                    intr,
                                    Lang.getEmbed(
                                        'validation',
                                        'embeds.birthdayRoleUsedError',
                                        data.lang,
                                        {
                                            AMOUNT: membersWithRole.toString(),
                                            ICON: intr.client.user.displayAvatarURL(),
                                        }
                                    )
                                );
                                return;
                            }

                            return { intr, value: birthdayRoleInput?.id };
                        }
                    },

                    expireFunction
                );

                if (roleResult === undefined) return;
                nextIntr = roleResult.intr;
                birthdayRole = roleResult.value;

                break;
            }
            case 'deny': {
                birthdayRole = undefined;
                break;
            }
        }

        let channelOutput = !birthdayChannel
            ? `${Lang.getRef('info', 'terms.notSet', data.lang)}`
            : guild.channels.resolve(birthdayChannel)?.toString() ||
              `**${Lang.getRef('info', 'terms.unknownChannel', data.lang)}**`;
        let roleOutput = !birthdayRole
            ? `${Lang.getRef('info', 'terms.notSet', data.lang)}`
            : guild.roles.resolve(birthdayRole)?.toString() ||
              `**${Lang.getRef('info', 'terms.unknownRole', data.lang)}**`;

        await InteractionUtils.send(
            nextIntr,
            Lang.getEmbed('results', 'success.requiredSetup', data.lang, {
                CHANNEL: channelOutput,
                ROLE: roleOutput,
                ICON: intr.client.user.displayAvatarURL(),
            })
        );

        // upsert the guild
        guildData = await data.em.upsert(GuildData, {
            discordId: guild.id,
            birthdaySettings: {
                channelDiscordId: birthdayChannel,
                roleDiscordId: birthdayRole,
            },
        });
        await data.em.persistAndFlush(guildData);
    }
}
