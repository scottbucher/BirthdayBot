import { ApplicationCommandOptionType } from 'discord-api-types/payloads/v9';
import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { Command } from './command';

// did I not split this up correctly?
export class MessageCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.message'),
        description: 'Manage message settings and specific custom messages.',
        options: [
            {
                name: Lang.getCom('subCommands.edit'),
                description: `Edit a custom message's settings.`,
                type: ApplicationCommandOptionType.SubcommandGroup.valueOf(),
                options: [
                    {
                        name: Lang.getCom('subCommands.embed'),
                        description: 'Change the embed setting of a message.',
                        type: ApplicationCommandOptionType.Subcommand.valueOf(),
                        options: [
                            {
                                name: Lang.getCom('arguments.embed'),
                                description:
                                    'Whether or not this custom message should be displayed as an embed.',
                                type: ApplicationCommandOptionType.Boolean.valueOf(),
                                required: true,
                            },
                        ],
                    },
                    {
                        name: Lang.getCom('subCommands.color'),
                        description:
                            '[Premium Feature] Change the color of a message. Only works if embed is enabled for this message.',
                        type: ApplicationCommandOptionType.Subcommand.valueOf(),
                        options: [
                            {
                                name: Lang.getCom('arguments.color'),
                                description: 'The color the embed should be.',
                                type: ApplicationCommandOptionType.String.valueOf(),
                                required: true,
                            },
                        ],
                    },
                ],
            },
            {
                name: Lang.getCom('subCommands.setting'),
                description: 'Edit the global message settings for each type.',
                type: ApplicationCommandOptionType.SubcommandGroup.valueOf(),
                options: [
                    {
                        name: Lang.getCom('subCommands.time'),
                        description: 'Change the time a message type should be sent.',
                        type: ApplicationCommandOptionType.Subcommand.valueOf(),
                        options: [
                            {
                                name: 'type',
                                description: 'What type of message this setting should apply to.',
                                required: true,
                                type: ApplicationCommandOptionType.String.valueOf(),
                                choices: [
                                    {
                                        name: 'birthday',
                                        value: 'BIRTHDAY',
                                    },
                                    {
                                        name: 'memberAnniversary',
                                        value: 'MEMBER_ANNIVERSARY',
                                    },
                                    {
                                        name: 'serverAnniversary',
                                        value: 'SERVER_ANNIVERSARY',
                                    },
                                ],
                            },
                            {
                                name: Lang.getCom('arguments.time'),
                                description: 'The time setting for a message type.',
                                type: ApplicationCommandOptionType.Number.valueOf(),
                                required: true,
                            },
                        ],
                    },
                    {
                        name: Lang.getCom('subCommands.mention'),
                        description: 'Change the role mention setting for a message type.',
                        type: ApplicationCommandOptionType.Subcommand.valueOf(),
                        options: [
                            {
                                name: 'type',
                                description: 'What type of message this setting should apply to.',
                                required: true,
                                type: ApplicationCommandOptionType.String.valueOf(),
                                choices: [
                                    {
                                        name: 'birthday',
                                        value: 'BIRTHDAY',
                                    },
                                    {
                                        name: 'memberAnniversary',
                                        value: 'MEMBER_ANNIVERSARY',
                                    },
                                    {
                                        name: 'serverAnniversary',
                                        value: 'SERVER_ANNIVERSARY',
                                    },
                                ],
                            },
                            {
                                name: Lang.getCom('arguments.mention'),
                                description: 'A role or group to mention.',
                                type: ApplicationCommandOptionType.Mentionable.valueOf(),
                                required: true,
                            },
                        ],
                    },
                ],
            },
            {
                name: Lang.getCom('subCommands.clear'),
                description: 'Clear all custom messages of a certain type.',
                type: ApplicationCommandOptionType.Subcommand.valueOf(),
                options: [
                    {
                        name: 'type',
                        description: 'What type of messages to permanently delete.',
                        required: true,
                        type: ApplicationCommandOptionType.String.valueOf(),
                        choices: [
                            {
                                name: 'birthday',
                                value: 'BIRTHDAY',
                            },
                            {
                                name: 'memberAnniversary',
                                value: 'MEMBER_ANNIVERSARY',
                            },
                            {
                                name: 'serverAnniversary',
                                value: 'SERVER_ANNIVERSARY',
                            },
                            {
                                name: 'userSpecificBirthday',
                                value: 'USER_SPECIFIC_BIRTHDAY',
                            },
                            {
                                name: 'userSpecificMemberAnniversary',
                                value: 'USER_SPECIFIC_MEMBER_ANNIVERSARY',
                            },
                        ],
                    },
                ],
            },
            {
                name: Lang.getCom('subCommands.test'),
                description: 'Test a custom message.',
                type: ApplicationCommandOptionType.Subcommand.valueOf(),
                options: [
                    {
                        name: 'type',
                        description: 'What type of message is being tested.',
                        required: true,
                        type: ApplicationCommandOptionType.String.valueOf(),
                        choices: [
                            {
                                name: 'birthday',
                                value: 'BIRTHDAY',
                            },
                            {
                                name: 'memberAnniversary',
                                value: 'MEMBER_ANNIVERSARY',
                            },
                            {
                                name: 'serverAnniversary',
                                value: 'SERVER_ANNIVERSARY',
                            },
                            {
                                name: 'userSpecificBirthday',
                                value: 'USER_SPECIFIC_BIRTHDAY',
                            },
                            {
                                name: 'userSpecificMemberAnniversary',
                                value: 'USER_SPECIFIC_MEMBER_ANNIVERSARY',
                            },
                        ],
                    },
                    {
                        name: Lang.getCom('arguments.position'),
                        description:
                            'The position number of the message, found in /message list. Leave empty to test the default message.',
                        type: ApplicationCommandOptionType.Number.valueOf(),
                        required: false,
                    },
                ],
            },
            {
                name: Lang.getCom('subCommands.list'),
                description: 'List the messages of a certain type.',
                type: ApplicationCommandOptionType.Subcommand.valueOf(),
                options: [
                    {
                        name: 'type',
                        description: 'What type of messages to list.',
                        required: true,
                        type: ApplicationCommandOptionType.String.valueOf(),
                        choices: [
                            {
                                name: 'birthday',
                                value: 'BIRTHDAY',
                            },
                            {
                                name: 'memberAnniversary',
                                value: 'MEMBER_ANNIVERSARY',
                            },
                            {
                                name: 'serverAnniversary',
                                value: 'SERVER_ANNIVERSARY',
                            },
                            {
                                name: 'userSpecificBirthday',
                                value: 'USER_SPECIFIC_BIRTHDAY',
                            },
                            {
                                name: 'userSpecificMemberAnniversary',
                                value: 'USER_SPECIFIC_MEMBER_ANNIVERSARY',
                            },
                        ],
                    },
                    {
                        name: Lang.getCom('arguments.page'),
                        description: 'An optional page number to jump to.',
                        type: ApplicationCommandOptionType.String.valueOf(),
                        required: false,
                        min_value: 1,
                    },
                ],
            },
            {
                name: Lang.getCom('subCommands.add'),
                description: 'Add a custom message of a certain type.',
                type: ApplicationCommandOptionType.Subcommand.valueOf(),
                options: [
                    {
                        name: 'type',
                        description: 'What type of message is being added.',
                        required: true,
                        type: ApplicationCommandOptionType.String.valueOf(),
                        choices: [
                            {
                                name: 'birthday',
                                value: 'BIRTHDAY',
                            },
                            {
                                name: 'memberAnniversary',
                                value: 'MEMBER_ANNIVERSARY',
                            },
                            {
                                name: 'serverAnniversary',
                                value: 'SERVER_ANNIVERSARY',
                            },
                        ],
                    },
                    {
                        name: Lang.getCom('arguments.message'),
                        description:
                            'The message to add. Available placeholders: %Users% or @User, %Server%, %Year% (Anniversaries only).',
                        type: ApplicationCommandOptionType.String.valueOf(),
                        required: true,
                    },
                ],
            },
        ],
    };
    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        // await MessageUtils.sendIntr(intr, Lang.getEmbed('embeds.help', data.lang()));
    }
}
