import { ApplicationCommandOptionType } from 'discord-api-types/payloads/v9';
import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { CommandUtils } from '../utils';
import { BlacklistAddSubCommand } from './blacklist/add';
import { BlacklistClearSubCommand } from './blacklist/clear';
import { Command } from './command';

export class BlacklistCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.blacklist'),
        description: 'Manage the blacklist.',
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
                        type: ApplicationCommandOptionType.String.valueOf(),
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
