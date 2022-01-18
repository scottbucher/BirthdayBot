import {
    GuildData,
    CustomMessage,
    TrustedRole,
    MemberAnniversaryRole,
    Blacklist,
} from './index.js';

export class GuildCelebrationData {
    guildData: GuildData;
    customMessages: CustomMessage[];
    blacklist: Blacklist[];
    trustedRoles: TrustedRole[];
    anniversaryRoles: MemberAnniversaryRole[];
}
