import { GuildMember, Role } from 'discord.js';
export class BirthdayMemberRoleStatus {
    constructor(public member: GuildMember, public give: Boolean) {}
}
export class BirthdayMemberStatus {
    constructor(
        public member: GuildMember,
        public needsMessage: Boolean,
        public needsRoleAdded: Boolean,
        public needsRoleRemoved: Boolean
    ) {}
}

export class AnniversaryMemberStatus {
    constructor(public member: GuildMember, public needsMessage: Boolean, public role: Role) {}
}
