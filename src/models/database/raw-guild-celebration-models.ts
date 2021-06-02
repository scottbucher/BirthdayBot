import { CustomMessage, TrustedRole } from '.';

import { Blacklist } from './blacklisted-models';
import { GuildData } from './guild-models';
import { MemberAnniversaryRole } from './member-anniversary-role-models';

export class RawGuildCelebrationData {
    guildDatas: GuildData[];
    customMessages: CustomMessage[];
    blacklistedMembers: Blacklist[];
    trustedRoles: TrustedRole[];
    anniversaryRoles: MemberAnniversaryRole[];

    constructor(
        guildData: GuildData[],
        customMessages: CustomMessage[],
        blacklistedMembers: Blacklist[],
        trustedRoles: TrustedRole[],
        anniversaryRoles: MemberAnniversaryRole[]
    ) {
        this.guildDatas = guildData;
        this.customMessages = customMessages;
        this.blacklistedMembers = blacklistedMembers;
        this.trustedRoles = trustedRoles;
        this.anniversaryRoles = anniversaryRoles;
    }
}
