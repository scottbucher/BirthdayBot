import {
    BlacklistData,
    GuildData,
    MemberAnniversaryRoleData,
    TrustedRoleData,
    UserData,
    VoteData,
} from './index.js';

export class DatabaseModel {
    guildData?: GuildData;
    userDatas?: UserData[];
    blacklistData?: BlacklistData;
    trustedRoleData?: TrustedRoleData;
    memberAnniversaryRoleData?: MemberAnniversaryRoleData;
    VoteData?: VoteData;
}
