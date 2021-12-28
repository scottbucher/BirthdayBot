import { ApplicationCommandData, CommandInteraction } from 'discord.js';

import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';

export class PremiumCommand implements Command {
    public data: ApplicationCommandData = {
        name: Lang.getCom('commands.premium'),
        description: 'View information about premium, or about your current premium subscription.',
    };
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        // yeet
    }
}
