import { GuildMember, Role } from 'discord.js';
export class BirthdayMemberStatus {
    constructor(
        public member: GuildMember,
        public needsMessage: boolean,
        public needsRoleAdded: boolean,
        public needsRoleRemoved: boolean
    ) {}
}

export class AnniversaryMemberStatus {
    constructor(public member: GuildMember, public needsMessage: boolean, public role: Role) {}
}
