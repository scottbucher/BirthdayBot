import { Loaded } from '@mikro-orm/core';
import { MongoDriver, MongoEntityManager } from '@mikro-orm/mongodb';
import { Locale } from 'discord.js';

import { CustomEventData, GuildData } from '../database/entities/index.js';
import { MessageData } from '../database/entities/message.js';

// This class is used to store and pass data along in events
export class EventData {
    constructor(
        public lang: Locale,
        public langGuild: Locale,
        public em: MongoEntityManager<MongoDriver>,
        public guildData?: Loaded<GuildData>,
        public messageData?: Loaded<MessageData>,
        public eventData?: Loaded<CustomEventData, 'message'>
    ) {}
}

export interface ButtonData {
    id?: string; // Button ID
    lc?: string; // Link Command
    ch?: string; // Channel Discord ID
    lg?: Locale; // Language
    pg?: number; // Page
}
