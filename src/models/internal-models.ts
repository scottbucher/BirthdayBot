import { SubscriptionStatus } from '.';
import { Lang } from '../services';
import { GuildData, Vote } from './database';
import { LangCode } from './enums';

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
