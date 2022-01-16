import { ApplicationCommandOptionType } from 'discord-api-types/payloads/v9';
import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { CommandUtils } from '../utils';
import { Command } from './command';

export class MemberAnniversaryRoleCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.mar'),
        description: '[Premium Feature] Manage the Member Anniversary Roles.',
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
    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
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
