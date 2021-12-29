import { ApplicationCommandData, CommandInteraction, MessageEmbed } from 'discord.js';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';

export class NextCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.next'),
        description: 'View the next event date. Defaults to birthday.',
        options: [
            {
                name: Lang.getCom('arguments.type'),
                description: 'What type of event to view the next of.',
                type: ApplicationCommandOptionType.String.valueOf(),
                required: false,
                choices: [
                    {
                        name: 'birthday',
                        value: 'BIRTHDAY',
                    },
                    {
                        name: 'memberAnniversary',
                        value: 'MEMBER_ANNIVERSARY',
                    },
                    {
                        name: 'serverAnniversary',
                        value: 'SERVER_ANNIVERSARY',
                    },
                ],
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
