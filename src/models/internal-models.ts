import { Locale } from 'discord.js';

import { LangCode } from '../enums/lang-code.js';
import { Lang } from '../services/lang.js';

// This class is used to store and pass data along in events
export class EventData {
    // TODO: Add any data you want to store
    constructor(
        // Guild language
        public langGuild: Locale,
        public hasPremium?: boolean
    ) {}

    public lang(): LangCode {
        // TODO: Calculate language based on event data
        return Lang.Default;
    }
}
