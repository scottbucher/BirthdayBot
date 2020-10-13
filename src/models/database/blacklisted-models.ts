import { StatsData } from './stats-models';

export class Blacklisted {
    blacklistRows: Blacklist[];
    stats: StatsData;

    constructor(blacklistRows: Blacklist[], statsRow: StatsData) {
        this.blacklistRows = blacklistRows;
        this.stats = statsRow;
    }
}

export class Blacklist {
    UserId: string;
    Position: number;
}
