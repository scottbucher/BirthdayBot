import { StatsData } from './stats-models';

export class MemberAnniversaryRoles {
    memberAnniversaryRoles: MemberAnniversaryRole[];
    stats: StatsData;

    constructor(memberAnniversaryRoleRows: MemberAnniversaryRole[], statsRow: StatsData) {
        this.memberAnniversaryRoles = memberAnniversaryRoleRows;
        this.stats = statsRow;
    }
}

export class MemberAnniversaryRole {
    MemberAnniversaryRoleDiscordId: string;
    Year: number;
    Position: number;
}
