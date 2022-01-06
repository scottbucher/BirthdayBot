import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';

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
                        type: ApplicationCommandOptionType.Number.valueOf(),
                        required: true,
                        min_value: 1,
                        max_value: 100,
                    },
                ],
            },
            {
                name: Lang.getCom('subCommands.remove'),
                description: '[Premium Feature] Remove a member anniversary role.',
                type: ApplicationCommandOptionType.SubcommandGroup.valueOf(),
                options: [
                    {
                        name: Lang.getCom('subCommands.role'),
                        description: 'Role to remove from the member anniversary list.',
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
                            '[Premium Feature] Remove a deleted role from the member anniversary role list using an id.',
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
    public requirePremium = true;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        // await MessageUtils.sendIntr(intr, Lang.getEmbed('embeds.help', data.lang()));
    }
}
