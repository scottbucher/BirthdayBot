import { GuildData, Vote } from './database';

import { Lang } from '../services';
import { LangCode } from './enums';
import { SubscriptionStatus } from '.';

// This class is used to store and pass data along in events
export class EventData {
    constructor(
        public guild?: GuildData,
        public subscription?: SubscriptionStatus,
        public vote?: Vote
    ) {}

    public lang(): LangCode {
        // TODO: Calculate language based on event data
        return Lang.Default;
    }
}
