import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';

export class TestCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.test'),
        description: 'View the next event date. Defaults to birthday.',
        options: [
            {
                name: Lang.getCom('arguments.type'),
                description: 'What type of event to test.',
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
                description: 'Optional user argument to test the event on.',
                type: ApplicationCommandOptionType.User.valueOf(),
                required: false,
            },
        ],
    };
    public requireDev = false;
    public requireGuild = false;
    public requireUserPerms: PermissionString[] = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        // yeet
    }
}
