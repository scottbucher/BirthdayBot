import { StatsData } from './index.js';

export class BlacklistData {
    blacklist: Blacklist[];
    stats: StatsData;

    constructor(blacklistRows: Blacklist[], statsRow: StatsData) {
        this.blacklist = blacklistRows;
        this.stats = statsRow;
    }
}

export class Blacklist {
    GuildId: number;
    DiscordId: string;
    Position: number;
}
