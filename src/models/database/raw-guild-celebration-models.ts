import {
    Blacklist,
    CustomMessage,
    GuildData,
    MemberAnniversaryRole,
    TrustedRole,
} from './index.js';

export class RawGuildCelebrationData {
    constructor(
        public guildDatas: GuildData[],
        public customMessages: CustomMessage[],
        public blacklist: Blacklist[],
        public trustedRoles: TrustedRole[],
        public anniversaryRoles: MemberAnniversaryRole[]
    ) {}
}
