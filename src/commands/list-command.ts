import { ApplicationCommandData, CommandInteraction, MessageEmbed } from 'discord.js';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';

export class ListCommand implements Command {
    public data: ApplicationCommandData = {
        name: Lang.getCom('commands.list'),
        description: 'View the birthday list.',
        options: [
            {
                name: Lang.getCom('arguments.page'),
                description: 'An optional page number to jump to.',
                type: ApplicationCommandOptionType.String.valueOf(),
                required: false,
            },
        ],
    };
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        // yeet
    }
}
