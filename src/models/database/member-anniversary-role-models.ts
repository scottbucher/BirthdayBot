import { StatsData } from './index.js';

export class MemberAnniversaryRoleData {
    memberAnniversaryRoles: MemberAnniversaryRole[];
    stats: StatsData;

    constructor(memberAnniversaryRoleRows: MemberAnniversaryRole[], statsRow: StatsData) {
        this.memberAnniversaryRoles = memberAnniversaryRoleRows;
        this.stats = statsRow;
    }
}

export class MemberAnniversaryRole {
    GuildId: number;
    MemberAnniversaryRoleDiscordId: string;
    Year: number;
    Position: number;
}
