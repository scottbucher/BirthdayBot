import { CustomMessage, TrustedRole } from '.';

import { Blacklist } from './blacklisted-models';
import { GuildData } from './guild-models';
import { MemberAnniversaryRole } from './member-anniversary-role-models';

export class GuildCelebrationData {
    guildData: GuildData;
    customMessages: CustomMessage[];
    blacklist: Blacklist[];
    trustedRoles: TrustedRole[];
    anniversaryRoles: MemberAnniversaryRole[];
}
