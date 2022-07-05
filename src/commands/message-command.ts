import {
    ApplicationCommandOptionType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import { CommandInteraction, Permissions, PermissionString } from 'discord.js';

import { EventData } from '../models/index.js';
import { Lang } from '../services/index.js';
import { CommandUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class MessageCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.message'),
        description: 'Manage message settings and specific custom messages.',
        dm_permission: false,
        default_member_permissions: Permissions.resolve([
            Permissions.FLAGS.ADMINISTRATOR,
        ]).toString(),
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
                                name: Lang.getCom('arguments.type'),
                                description: 'What type of message is being removed.',
                                required: true,
                                type: ApplicationCommandOptionType.String.valueOf(),
                                choices: [
                                    {
                                        name: 'birthday',
                                        value: 'birthday',
                                    },
                                    {
                                        name: 'memberAnniversary',
                                        value: 'member_anniversary',
                                    },
                                    {
                                        name: 'serverAnniversary',
                                        value: 'server_anniversary',
                                    },
                                    {
                                        name: 'userSpecificBirthday',
                                        value: 'user_specific_birthday',
                                    },
                                    {
                                        name: 'userSpecificMemberAnniversary',
                                        value: 'user_specific_member_anniversary',
                                    },
                                ],
                            },
                            {
                                name: Lang.getCom('arguments.position'),
                                description:
                                    'The position number of the message, found in /message list. Leave empty to test the default message.',
                                type: ApplicationCommandOptionType.Integer.valueOf(),
                                required: true,
                                min_value: 0,
                                max_value: 500,
                            },
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
                                name: Lang.getCom('arguments.type'),
                                description: 'What type of message is being removed.',
                                required: true,
                                type: ApplicationCommandOptionType.String.valueOf(),
                                choices: [
                                    {
                                        name: 'birthday',
                                        value: 'birthday',
                                    },
                                    {
                                        name: 'memberAnniversary',
                                        value: 'member_anniversary',
                                    },
                                    {
                                        name: 'serverAnniversary',
                                        value: 'server_anniversary',
                                    },
                                    {
                                        name: 'userSpecificBirthday',
                                        value: 'user_specific_birthday',
                                    },
                                    {
                                        name: 'userSpecificMemberAnniversary',
                                        value: 'user_specific_member_anniversary',
                                    },
                                ],
                            },
                            {
                                name: Lang.getCom('arguments.position'),
                                description:
                                    'The position number of the message, found in /message list. Leave empty to test the default message.',
                                type: ApplicationCommandOptionType.Integer.valueOf(),
                                required: true,
                                min_value: 0,
                                max_value: 500,
                            },
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
                                name: Lang.getCom('arguments.type'),
                                description: 'What type of message this setting should apply to.',
                                required: true,
                                type: ApplicationCommandOptionType.String.valueOf(),
                                choices: [
                                    {
                                        name: 'birthday',
                                        value: 'birthday',
                                    },
                                    {
                                        name: 'memberAnniversary',
                                        value: 'member_anniversary',
                                    },
                                    {
                                        name: 'serverAnniversary',
                                        value: 'server_anniversary',
                                    },
                                ],
                            },
                            {
                                name: Lang.getCom('arguments.time'),
                                description: 'The time setting for a message type. Values: 0-23.',
                                type: ApplicationCommandOptionType.Integer.valueOf(),
                                required: true,
                                min_value: 0,
                                max_value: 23,
                            },
                        ],
                    },
                    {
                        name: Lang.getCom('subCommands.mention'),
                        description:
                            'Change the role mention setting for a message type. Values: everyone, here, @role/role-name, none.',
                        type: ApplicationCommandOptionType.Subcommand.valueOf(),
                        options: [
                            {
                                name: Lang.getCom('arguments.type'),
                                description: 'What type of message this setting should apply to.',
                                required: true,
                                type: ApplicationCommandOptionType.String.valueOf(),
                                choices: [
                                    {
                                        name: 'birthday',
                                        value: 'birthday',
                                    },
                                    {
                                        name: 'memberAnniversary',
                                        value: 'member_anniversary',
                                    },
                                    {
                                        name: 'serverAnniversary',
                                        value: 'server_anniversary',
                                    },
                                ],
                            },
                            {
                                name: Lang.getCom('arguments.mention'),
                                description:
                                    'A role, @everyone, or @here. The selected group will be mentioned with the birthday message.',
                                type: ApplicationCommandOptionType.String.valueOf(),
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
                        name: Lang.getCom('arguments.type'),
                        description: 'What type of messages to permanently delete.',
                        required: true,
                        type: ApplicationCommandOptionType.String.valueOf(),
                        choices: [
                            {
                                name: 'birthday',
                                value: 'birthday',
                            },
                            {
                                name: 'memberAnniversary',
                                value: 'member_anniversary',
                            },
                            {
                                name: 'serverAnniversary',
                                value: 'server_anniversary',
                            },
                            {
                                name: 'userSpecificBirthday',
                                value: 'user_specific_birthday',
                            },
                            {
                                name: 'userSpecificMemberAnniversary',
                                value: 'user_specific_member_anniversary',
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
                        name: Lang.getCom('arguments.type'),
                        description: 'What type of message is being tested.',
                        required: true,
                        type: ApplicationCommandOptionType.String.valueOf(),
                        choices: [
                            {
                                name: 'birthday',
                                value: 'birthday',
                            },
                            {
                                name: 'memberAnniversary',
                                value: 'member_anniversary',
                            },
                            {
                                name: 'serverAnniversary',
                                value: 'server_anniversary',
                            },
                            {
                                name: 'userSpecificBirthday',
                                value: 'user_specific_birthday',
                            },
                            {
                                name: 'userSpecificMemberAnniversary',
                                value: 'user_specific_member_anniversary',
                            },
                        ],
                    },
                    {
                        name: Lang.getCom('arguments.position'),
                        description:
                            'The position number of the message, found in /message list. Leave empty to test the default message.',
                        type: ApplicationCommandOptionType.Integer.valueOf(),
                        required: false,
                    },
                    {
                        name: Lang.getCom('arguments.userCount'),
                        description:
                            'The number of users to put in this message to imitate multiple birthdays. Defaults to 1.',
                        type: ApplicationCommandOptionType.Integer.valueOf(),
                        required: false,
                        min_value: 1,
                        max_value: 5,
                    },
                ],
            },
            {
                name: Lang.getCom('subCommands.list'),
                description: 'List the messages of a certain type.',
                type: ApplicationCommandOptionType.Subcommand.valueOf(),
                options: [
                    {
                        name: Lang.getCom('arguments.type'),
                        description: 'What type of messages to list.',
                        required: true,
                        type: ApplicationCommandOptionType.String.valueOf(),
                        choices: [
                            {
                                name: 'birthday',
                                value: 'birthday',
                            },
                            {
                                name: 'memberAnniversary',
                                value: 'member_anniversary',
                            },
                            {
                                name: 'serverAnniversary',
                                value: 'server_anniversary',
                            },
                            {
                                name: 'userSpecificBirthday',
                                value: 'user_specific_birthday',
                            },
                            {
                                name: 'userSpecificMemberAnniversary',
                                value: 'user_specific_member_anniversary',
                            },
                        ],
                    },
                    {
                        name: Lang.getCom('arguments.page'),
                        description: 'An optional page number to jump to.',
                        type: ApplicationCommandOptionType.Integer.valueOf(),
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
                        name: Lang.getCom('arguments.type'),
                        description: 'What type of message is being added.',
                        required: true,
                        type: ApplicationCommandOptionType.String.valueOf(),
                        choices: [
                            {
                                name: 'birthday',
                                value: 'birthday',
                            },
                            {
                                name: 'memberAnniversary',
                                value: 'member_anniversary',
                            },
                            {
                                name: 'serverAnniversary',
                                value: 'server_anniversary',
                            },
                        ],
                    },
                    {
                        name: Lang.getCom('arguments.message'),
                        description:
                            'The message to add. Available placeholders: {Users} or @User, {Server}, {Year} (Anniversaries only).',
                        type: ApplicationCommandOptionType.String.valueOf(),
                        required: true,
                    },
                ],
            },
            {
                name: Lang.getCom('subCommands.remove'),
                description: 'Remove a custom message of a certain type.',
                type: ApplicationCommandOptionType.Subcommand.valueOf(),
                options: [
                    {
                        name: Lang.getCom('arguments.type'),
                        description: 'What type of message is being removed.',
                        required: true,
                        type: ApplicationCommandOptionType.String.valueOf(),
                        choices: [
                            {
                                name: 'birthday',
                                value: 'birthday',
                            },
                            {
                                name: 'memberAnniversary',
                                value: 'member_anniversary',
                            },
                            {
                                name: 'serverAnniversary',
                                value: 'server_anniversary',
                            },
                            {
                                name: 'userSpecificBirthday',
                                value: 'user_specific_birthday',
                            },
                            {
                                name: 'userSpecificMemberAnniversary',
                                value: 'user_specific_member_anniversary',
                            },
                        ],
                    },
                    {
                        name: Lang.getCom('arguments.position'),
                        description:
                            'The message to remove. Find the position with /message list <type>',
                        type: ApplicationCommandOptionType.Integer.valueOf(),
                        required: true,
                    },
                ],
            },
        ],
    };
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    constructor(public commands: Command[]) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let command = CommandUtils.findCommand(this.commands, intr.options.getSubcommand());
        if (!command) {
            // TODO: Should we log error here?
            return;
        }

        let passesChecks = await CommandUtils.runChecks(command, intr, data);
        if (passesChecks) {
            await command.execute(intr, data);
        }
    }
}
