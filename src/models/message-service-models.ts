import { GuildMember, Message } from 'discord.js';

import { GuildCelebrationData } from './database';

export class MessageService {
    constructor(
        public guildCelebrationData: GuildCelebrationData,
        public celebrationMessages: CelebrationMessage[]
    ) {}
}

export class CelebrationMessage {
    type: string;
    message: Message;
    members: GuildMember[];
    userDiscordId: string;
    settings: {
        mention: string;
        embed: boolean;
        color: string;
    };
    placeholders: {
        year: number;
        serverName: string;
    };
}
