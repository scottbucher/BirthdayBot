import { ApplicationCommandData, CommandInteraction, MessageEmbed } from 'discord.js';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';

export class SetupCommand implements Command {
    public data: ApplicationCommandData = {
        name: Lang.getCom('commands.setup'),
        description: 'Run one of the setup processes.',
        options: [
            {
                name: 'setup',
                description: 'Setup to run, leave blank for default.',
                required: false,
                type: ApplicationCommandOptionType.String.valueOf(),
                choices: [
                    {
                        name: 'default',
                        value: 'DEFAULT',
                    },
                    {
                        name: 'trusted',
                        value: 'TRUSTED',
                    },
                    {
                        name: 'anniversary',
                        value: 'ANNIVERSARY',
                    },
                ],
            },
        ],
    };
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let option = intr.options.getString('link');

        option = !option ? 'DEFAULT' : option;
        switch (option) {
            case 'DEFAULT': {
                // yeet
                break;
            }
            case 'TRUSTED': {
                // yeet
                break;
            }
            case 'ANNIVERSARY': {
                // yeet
                break;
            }
        }
    }
}
