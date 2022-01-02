import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models';

export interface Command {
    metadata: ApplicationCommandData;
    requireDev: boolean;
    requireGuild: boolean;
    requireClientPerms: PermissionString[];
    requireUserPerms: PermissionString[];
    requireSetup: boolean;
    requireVote: boolean;
    requirePremium: boolean;
    execute(intr: CommandInteraction, data: EventData): Promise<void>;
}
