import { CustomMessage, TrustedRole } from '.';

import { Blacklist } from './blacklisted-models';
import { GuildData } from './guild-models';
import { MemberAnniversaryRole } from './member-anniversary-role-models';

export interface GuildCelebrationData {
    guildDatas: GuildData[];
    customMessages: CustomMessage[];
    blacklistedMembers: Blacklist[];
    trustedRoles: TrustedRole[];
    anniversaryRoles: MemberAnniversaryRole[];
}
