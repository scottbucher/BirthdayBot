import {
    Blacklist,
    CustomMessage,
    GuildData,
    MemberAnniversaryRole,
    TrustedRole,
} from './index.js';

export class GuildCelebrationData {
    guildData: GuildData;
    customMessages: CustomMessage[];
    blacklist: Blacklist[];
    trustedRoles: TrustedRole[];
    anniversaryRoles: MemberAnniversaryRole[];
}
