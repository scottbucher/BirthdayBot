import {
    ApplicationCommandOptionType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import { CommandInteraction, Permissions, PermissionString } from 'discord.js';

import { EventData } from '../models/index.js';
import { Lang } from '../services/index.js';
import { CommandUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class MemberAnniversaryRoleCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.mar'),
        description: '[Premium Feature] Manage the Member Anniversary Roles.',
        dm_permission: false,
        default_member_permissions: Permissions.resolve([
            Permissions.FLAGS.ADMINISTRATOR,
        ]).toString(),
        options: [
            {
                name: Lang.getCom('subCommands.add'),
                description: 'Add a member anniversary role.',
                type: ApplicationCommandOptionType.Subcommand.valueOf(),
                options: [
                    {
                        name: Lang.getCom('arguments.role'),
                        description: 'The role to add.',
                        type: ApplicationCommandOptionType.Role.valueOf(),
                        required: true,
                    },
                    {
                        name: Lang.getCom('arguments.year'),
                        description:
                            'The year of the member anniversary the role should be given at.',
                        type: ApplicationCommandOptionType.Integer.valueOf(),
                        required: true,
                        min_value: 1,
                        max_value: 100,
                    },
                ],
            },
            {
                name: Lang.getCom('subCommands.remove'),
                description: '[Premium Feature] Remove a member anniversary role.',
                type: ApplicationCommandOptionType.Subcommand.valueOf(),
                options: [
                    {
                        name: Lang.getCom('arguments.year'),
                        description: 'The year to remove.',
                        type: ApplicationCommandOptionType.Integer.valueOf(),
                        required: true,
                    },
                ],
            },
            {
                name: Lang.getCom('subCommands.clear'),
                description: '[Premium Feature] Clear all member anniversary roles.',
                type: ApplicationCommandOptionType.Subcommand.valueOf(),
            },
            {
                name: Lang.getCom('subCommands.list'),
                description: '[Premium Feature] List the member anniversary roles.',
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
    public requirePremium = true;

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
