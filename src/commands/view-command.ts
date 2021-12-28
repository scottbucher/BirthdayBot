import { ApplicationCommandData, CommandInteraction } from 'discord.js';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';

export class ViewCommand implements Command {
    public data: ApplicationCommandData = {
        name: Lang.getCom('commands.view'),
        description:
            "View your, or someone else's birthday or anniversary. Or view the server's anniversary.",
        options: [
            {
                name: Lang.getCom('arguments.type'),
                description: 'What type of event to view.',
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
            {
                name: Lang.getCom('arguments.user'),
                description: 'Optional user argument to view. Defaults to you.',
                type: ApplicationCommandOptionType.User.valueOf(),
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
