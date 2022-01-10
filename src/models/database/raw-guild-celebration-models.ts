import { CustomMessage, TrustedRole } from '.';
import { Blacklist } from './blacklisted-models';
import { GuildData } from './guild-models';
import { MemberAnniversaryRole } from './member-anniversary-role-models';

export class RawGuildCelebrationData {
    constructor(
        public guildDatas: GuildData[],
        public customMessages: CustomMessage[],
        public blacklist: Blacklist[],
        public trustedRoles: TrustedRole[],
        public anniversaryRoles: MemberAnniversaryRole[]
    ) {}
}
