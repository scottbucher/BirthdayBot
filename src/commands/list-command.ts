import {
    ApplicationCommandData,
    CommandInteraction,
    MessageEmbed,
    PermissionString,
} from 'discord.js';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';

export class ListCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.list'),
        description: 'View the birthday list.',
        options: [
            {
                name: Lang.getCom('arguments.page'),
                description: 'An optional page number to jump to.',
                type: ApplicationCommandOptionType.String.valueOf(),
                required: false,
                min_value: 1,
            },
        ],
    };
    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = true;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        // yeet
    }
}
