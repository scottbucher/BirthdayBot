import {
    ApplicationCommandOptionChoiceData,
    AutocompleteFocusedOption,
    AutocompleteInteraction,
    CommandInteraction,
    PermissionsString,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { DataValidation } from '../enums/data-validation.js';
import { EventDataType } from '../enums/index.js';
import { EventData } from '../models/internal-models.js';

export interface Command {
    names: string[];
    cooldown?: RateLimiter;
    deferType: CommandDeferType;
    requireClientPerms: PermissionsString[];
    requireEventData: EventDataType[];
    dataValidation: DataValidation[];
    autocomplete?(
        intr: AutocompleteInteraction,
        option: AutocompleteFocusedOption,
        data: EventData
    ): Promise<ApplicationCommandOptionChoiceData[]>;
    execute(intr: CommandInteraction, data: EventData): Promise<void>;
}

export enum CommandDeferType {
    PUBLIC = 'PUBLIC',
    HIDDEN = 'HIDDEN',
    NONE = 'NONE',
}
