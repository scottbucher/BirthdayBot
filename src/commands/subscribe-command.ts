import { ApplicationCommandData, CommandInteraction } from 'discord.js';

import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';

export class SubscribeCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.subscribe'),
        description: 'Subscribe to Birthday Bot Premium.',
    };
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        // yeet
    }
}
