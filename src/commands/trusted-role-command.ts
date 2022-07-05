import {
    ApplicationCommandOptionType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import { CommandInteraction, Permissions, PermissionString } from 'discord.js';

import { EventData } from '../models/index.js';
import { Lang } from '../services/index.js';
import { CommandUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class TrustedRoleCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.trustedRole'),
        description: 'Manage the Trusted Roles. (Premium servers can have multiple trusted roles)',
        dm_permission: false,
        default_member_permissions: Permissions.resolve([
            Permissions.FLAGS.ADMINISTRATOR,
        ]).toString(),
        options: [
            {
                name: Lang.getCom('subCommands.add'),
                description:
                    'Add a trusted role. (Premium servers can have multiple trusted roles)',
                type: ApplicationCommandOptionType.Subcommand.valueOf(),
                options: [
                    {
                        name: Lang.getCom('arguments.role'),
                        description: 'The role to add.',
                        type: ApplicationCommandOptionType.Role.valueOf(),
                        required: true,
                    },
                ],
            },
            {
                name: Lang.getCom('subCommands.remove'),
                description: 'Remove a trusted role',
                type: ApplicationCommandOptionType.SubcommandGroup.valueOf(),
                options: [
                    {
                        name: Lang.getCom('subCommands.role'),
                        description: 'Role to remove from the trusted role list.',
                        type: ApplicationCommandOptionType.Subcommand.valueOf(),
                        options: [
                            {
                                name: Lang.getCom('arguments.role'),
                                description: 'The role to remove.',
                                type: ApplicationCommandOptionType.Role.valueOf(),
                                required: true,
                            },
                        ],
                    },
                    {
                        name: Lang.getCom('subCommands.id'),
                        description:
                            'Remove an ID from the trusted role list. Used when a role has been deleted.',
                        type: ApplicationCommandOptionType.Subcommand.valueOf(),
                        options: [
                            {
                                name: Lang.getCom('arguments.id'),
                                description: 'The id to remove.',
                                type: ApplicationCommandOptionType.String.valueOf(),
                                required: true,
                            },
                        ],
                    },
                ],
            },
            {
                name: Lang.getCom('subCommands.clear'),
                description: 'Clear all trusted roles.',
                type: ApplicationCommandOptionType.Subcommand.valueOf(),
            },
            {
                name: Lang.getCom('subCommands.list'),
                description:
                    'List the trusted roles. (Premium servers can have multiple trusted roles)',
                type: ApplicationCommandOptionType.Subcommand.valueOf(),
                options: [
                    {
                        name: Lang.getCom('arguments.page'),
                        description: 'An optional page number to jump to.',
                        type: ApplicationCommandOptionType.Integer.valueOf(),
                        required: false,
                        min_value: 1,
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

    constructor(private commands: Command[]) {}

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
