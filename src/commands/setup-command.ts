import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import {
    BaseCommandInteraction,
    CommandInteraction,
    MessageComponentInteraction,
    Modal,
    ModalSubmitInteraction,
    Permissions,
    PermissionString,
    TextBasedChannel,
} from 'discord.js';
import { ExpireFunction } from 'discord.js-collector-utils';
import { createRequire } from 'node:module';

import { EventData } from '../models/index.js';
import { GuildRepo } from '../services/database/repos/index.js';
import { Lang } from '../services/index.js';
import { ClientUtils, CollectorUtils, InteractionUtils, PermissionUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
export class SetupCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.setup'),
        description: 'Run the initial setup processes.',
        dm_permission: false,
        default_member_permissions: Permissions.resolve([
            Permissions.FLAGS.MANAGE_GUILD,
        ]).toString(),
    };
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [
        'VIEW_CHANNEL',
        'MANAGE_CHANNELS',
        'MANAGE_ROLES',
    ];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    constructor(public guildRepo: GuildRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let guild = intr.guild;

        let birthdayChannel: string;
        let birthdayRole: string;

        let nextIntr:
            | BaseCommandInteraction
            | MessageComponentInteraction
            | ModalSubmitInteraction = intr;
        let expireFunction: ExpireFunction = async () => {
            await InteractionUtils.send(
                nextIntr,
                Lang.getEmbed('results', 'fail.promptExpired', data.lang())
            );
        };

        let channelEmbed = Lang.getEmbed('prompts', 'setup.birthdayChannel', data.lang(), {
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
                let botRoleId = guild.me.roles.cache.filter(role => role.managed)?.first()?.id;
                if (!botRoleId) {
                    await InteractionUtils.send(
                        nextIntr,
                        Lang.getErrorEmbed('validation', 'errorEmbeds.noBotRole', data.lang())
                    );
                    return;
                }
                birthdayChannel = (
                    await guild.channels.create(
                        Lang.getRef('info', 'defaults.birthdayChannelName', data.lang()),
                        {
                            type: 'GUILD_TEXT',
                            topic: Lang.getRef(
                                'info',
                                'defaults.birthdayChannelTopic',
                                data.lang()
                            ),
                            permissionOverwrites: [
                                {
                                    id: guild.id,
                                    deny: ['SEND_MESSAGES'],
                                    allow: ['VIEW_CHANNEL'],
                                },
                                {
                                    id: botRoleId,
                                    allow: [
                                        'VIEW_CHANNEL',
                                        'SEND_MESSAGES',
                                        'EMBED_LINKS',
                                        'ADD_REACTIONS',
                                        'READ_MESSAGE_HISTORY',
                                    ],
                                },
                            ],
                        }
                    )
                )?.id;
                break;
            }
            case 'select': {
                let channelPrompt = await InteractionUtils.sendWithEnterResponseButton(
                    nextIntr,
                    data,
                    Lang.getEmbed('prompts', 'setup.inputChannel', data.lang())
                );

                let channelResult = await CollectorUtils.collectByModal(
                    channelPrompt,
                    new Modal({
                        customId: 'modal', // Will be overwritten
                        title: Lang.getRef('info', 'terms.birthdayChannel', data.lang()),
                        components: [
                            {
                                type: 'ACTION_ROW',
                                components: [
                                    {
                                        type: 'TEXT_INPUT',
                                        customId: 'birthday',
                                        label: Lang.getRef(
                                            'info',
                                            'terms.birthdayChannel',
                                            data.lang()
                                        ),
                                        required: true,
                                        style: 'SHORT',
                                        minLength: 1,
                                        placeholder: Lang.getRef(
                                            'info',
                                            'defaults.birthdayChannelName',
                                            data.lang()
                                        ),
                                    },
                                ],
                            },
                        ],
                    }),
                    intr.user,
                    async (intr: ModalSubmitInteraction) => {
                        let input = intr.components[0].components[0].value;

                        // Find mentioned channel
                        let givenChannel: TextBasedChannel = await ClientUtils.findTextChannel(
                            intr.guild,
                            input
                        );

                        if (!givenChannel) {
                            await InteractionUtils.send(
                                intr,
                                Lang.getErrorEmbed(
                                    'validation',
                                    'errorEmbeds.invalidChannel',
                                    data.lang()
                                )
                            );
                            return;
                        }

                        // Bot needs to be able to message in the desired channel
                        if (!PermissionUtils.canSend(givenChannel)) {
                            await InteractionUtils.send(
                                intr,
                                Lang.getEmbed(
                                    'validation',
                                    'embeds.noAccessToChannel',
                                    data.lang(),
                                    {
                                        CHANNEL: givenChannel.toString(),
                                    }
                                )
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
                birthdayChannel = '0';
                break;
            }
        }

        let roleEmbed = Lang.getEmbed('prompts', 'setup.birthdayRole', data.lang(), {
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
                    Lang.getEmbed('prompts', 'setup.inputRole', data.lang())
                );

                let roleResult = await CollectorUtils.collectByModal(
                    rolePrompt,
                    new Modal({
                        customId: 'modal', // Will be overwritten
                        title: Lang.getRef('info', 'terms.birthdayRole', data.lang()),
                        components: [
                            {
                                type: 'ACTION_ROW',
                                components: [
                                    {
                                        type: 'TEXT_INPUT',
                                        customId: 'role',
                                        label: Lang.getRef(
                                            'info',
                                            `terms.birthdayRole`,
                                            data.lang()
                                        ),
                                        required: true,
                                        style: 'SHORT',
                                        minLength: 1,
                                        placeholder: Config.emotes.birthday,
                                    },
                                ],
                            },
                        ],
                    }),
                    intr.user,
                    async (intr: ModalSubmitInteraction) => {
                        let input = intr.components[0].components[0].value;

                        if (input.toLowerCase() === 'none') {
                            return { intr, value: 'none' };
                        } else {
                            // Find mentioned role
                            let birthdayRoleInput = await ClientUtils.findRole(intr.guild, input);

                            // If it couldn't find the role, the role was in another guild, or the role the everyone role
                            if (
                                !birthdayRoleInput ||
                                birthdayRoleInput.id === guild.id ||
                                input.toLowerCase() === 'everyone'
                            ) {
                                InteractionUtils.send(
                                    intr,
                                    Lang.getErrorEmbed(
                                        'validation',
                                        'errorEmbeds.invalidRole',
                                        data.lang()
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
                                        data.lang(),
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
                                        data.lang()
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
                                        data.lang(),
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
                                        data.lang(),
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
                birthdayRole = '0';
                break;
            }
        }

        let channelOutput =
            birthdayChannel === '0'
                ? `${Lang.getRef('info', 'terms.notSet', data.lang())}`
                : guild.channels.resolve(birthdayChannel)?.toString() ||
                  `**${Lang.getRef('info', 'terms.unknownChannel', data.lang())}**`;
        let roleOutput =
            birthdayRole === '0'
                ? `${Lang.getRef('info', 'terms.notSet', data.lang())}`
                : guild.roles.resolve(birthdayRole)?.toString() ||
                  `**${Lang.getRef('info', 'terms.unknownRole', data.lang())}**`;

        await InteractionUtils.send(
            nextIntr,
            Lang.getEmbed('results', 'success.requiredSetup', data.lang(), {
                CHANNEL: channelOutput,
                ROLE: roleOutput,
                ICON: intr.client.user.displayAvatarURL(),
            })
        );

        await this.guildRepo.addOrUpdateGuild(guild.id, birthdayChannel, birthdayRole);
    }
}
