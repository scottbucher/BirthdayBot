import { StatsData } from './index.js';

export class CustomMessages {
    customMessages: CustomMessage[];
    stats: StatsData;

    constructor(customMessageRows: CustomMessage[], statsRow: StatsData) {
        this.customMessages = customMessageRows;
        this.stats = statsRow;
    }
}

export class CustomMessage {
    GuildId: number;
    Message: string;
    UserDiscordId: string;
    Type: string;
    Position: number;
    Color: string;
    Embed: number;
}
