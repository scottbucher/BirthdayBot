import { ChatInputApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { CustomRole } from '../enums/role.js';
import { EventData } from '../models/index.js';

export interface Command {
    metadata: ChatInputApplicationCommandData;
    cooldown?: RateLimiter;
    deferType: CommandDeferType;
    requireDev: boolean;
    requireGuild: boolean;
    requireClientPerms: PermissionString[];
    requireUserPerms: PermissionString[];
    requireRole: CustomRole[];
    requireSetup: boolean;
    requireVote: boolean;
    requirePremium: boolean;
    execute(intr: CommandInteraction, data: EventData): Promise<void>;
}

export enum CommandDeferType {
    PUBLIC = 'PUBLIC',
    HIDDEN = 'HIDDEN',
    NONE = 'NONE',
}
