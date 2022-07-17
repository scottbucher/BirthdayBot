import {
    BlacklistData,
    CustomMessageData,
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
    voteData?: VoteData;
    customMessageData?: CustomMessageData;
}
