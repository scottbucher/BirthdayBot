import {
    ApplicationCommandOptionType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import { CommandInteraction, Permissions, PermissionString } from 'discord.js';

import { EventData } from '../models/index.js';
import { Lang } from '../services/index.js';
import { CommandUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class BlacklistCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.blacklist'),
        description: 'Manage the blacklist.',
        dm_permission: false,
        default_member_permissions: Permissions.resolve([
            Permissions.FLAGS.ADMINISTRATOR,
        ]).toString(),
        options: [
            {
                name: Lang.getCom('subCommands.add'),
                description: 'Add a role or user to the blacklist.',
                type: ApplicationCommandOptionType.Subcommand.valueOf(),
                options: [
                    {
                        name: Lang.getCom('arguments.roleOrUser'),
                        description: 'The role or user to add to the blacklist.',
                        type: ApplicationCommandOptionType.Mentionable.valueOf(),
                        required: true,
                    },
                ],
            },
            {
                name: Lang.getCom('subCommands.remove'),
                description: 'Remove something from the blacklist.',
                type: ApplicationCommandOptionType.SubcommandGroup.valueOf(),
                options: [
                    {
                        name: Lang.getCom('subCommands.roleOrUser'),
                        description: 'Remove a role or user from the blacklist.',
                        type: ApplicationCommandOptionType.Subcommand.valueOf(),
                        options: [
                            {
                                name: Lang.getCom('arguments.roleOrUser'),
                                description: 'The role or user to remove.',
                                type: ApplicationCommandOptionType.Mentionable.valueOf(),
                                required: true,
                            },
                        ],
                    },
                    {
                        name: Lang.getCom('subCommands.id'),
                        description:
                            'Remove an ID from the blacklist. Used when a user has left or a role has been deleted.',
                        type: ApplicationCommandOptionType.Subcommand.valueOf(),
                        options: [
                            {
                                name: Lang.getCom('arguments.id'),
                                description: 'ID.',
                                type: ApplicationCommandOptionType.String.valueOf(),
                                required: true,
                            },
                        ],
                    },
                ],
            },
            {
                name: Lang.getCom('subCommands.clear'),
                description: 'Clear the blacklist.',
                type: ApplicationCommandOptionType.Subcommand.valueOf(),
            },
            {
                name: Lang.getCom('subCommands.list'),
                description: 'Show the blacklist.',
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
