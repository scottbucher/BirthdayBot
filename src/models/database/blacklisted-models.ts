import { StatsData } from './stats-models';

export class Blacklisted {
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
