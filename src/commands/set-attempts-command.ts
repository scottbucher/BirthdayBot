import { ApplicationCommandData, CommandInteraction } from 'discord.js';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';

export class SetAttemptsCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.setAttempts'),
        description: 'Set the attempts for a user. (Birthday bot staff only command)',
        options: [
            {
                name: Lang.getCom('arguments.user'),
                description: 'The user whose attempts you are changing.',
                type: ApplicationCommandOptionType.User.valueOf(),
                required: true,
            },
            {
                name: Lang.getCom('arguments.number'),
                description: 'The number of attempts you are setting their total to.',
                type: ApplicationCommandOptionType.Number.valueOf(),
                required: true,
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
