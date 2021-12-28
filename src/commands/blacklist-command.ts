import { ApplicationCommandData, CommandInteraction } from 'discord.js';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';

// did I not split this up correctly?
export class BlacklistCommand implements Command {
    public data: ApplicationCommandData = {
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
                        description: 'Page number.',
                        type: ApplicationCommandOptionType.Number.valueOf(),
                        required: false,
                    },
                ],
            },
        ],
    };
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        await MessageUtils.sendIntr(intr, Lang.getEmbed('displayEmbeds.help', data.lang()));
    }
}
