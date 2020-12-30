import { StatsData } from './stats-models';

export class TrustedRoles {
    trustedRoles: TrustedRole[];
    stats: StatsData;

    constructor(trustedRoleRows: TrustedRole[], statsRow: StatsData) {
        this.trustedRoles = trustedRoleRows;
        this.stats = statsRow;
    }
}

export class TrustedRole {
    TrustedRoleDiscordId: string;
}
