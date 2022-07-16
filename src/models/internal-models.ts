import { LangCode } from '../enums/index.js';
import { Lang } from '../services/index.js';
import { GuildData, VoteData } from './database/index.js';
import { SubscriptionStatus } from './index.js';

// This class is used to store and pass data along in events
export class EventData {
    constructor(
        public guild?: GuildData,
        public subscription?: SubscriptionStatus,
        public vote?: VoteData,
        public hasPremium?: boolean
    ) {}

    public lang(): LangCode {
        // TODO: Calculate language based on event data
        return Lang.Default;
    }
}
