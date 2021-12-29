import { ApplicationCommandData, CommandInteraction, MessageEmbed } from 'discord.js';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';

export class SettingsCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.settings'),
        description: 'View the settings for this server.',
        options: [
            {
                name: 'setting',
                description: 'The settings to view. Defaults to general.',
                required: false,
                type: ApplicationCommandOptionType.String.valueOf(),
                choices: [
                    {
                        name: 'general',
                        value: 'GENERAL',
                    },
                    {
                        name: 'message',
                        value: 'MESSAGE',
                    },
                    {
                        name: 'advanced',
                        value: 'ADVANCED',
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

        option = !option ? 'GENERAL' : option;

        let embed: MessageEmbed;
        switch (option) {
            case 'docs': {
                // yeet
                break;
            }
            case 'donate': {
                // yeet
                break;
            }
            case 'invite': {
                // yeet
                break;
            }
        }
    }
}
