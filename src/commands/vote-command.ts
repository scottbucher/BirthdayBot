import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';

export class VoteCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.vote'),
        description: 'Vote for Birthday Bot!',
    };
    public requireDev = false;
    public requireGuild = false;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        // yeet
    }
}
