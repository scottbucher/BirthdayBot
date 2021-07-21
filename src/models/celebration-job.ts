import { GuildMember, Role, TextChannel } from 'discord.js';

export class BirthdayMessageGuildMembers {
    constructor(public birthdayChannel: TextChannel, public member: GuildMember[]) {}
}

export class BirthdayRoleGuildMembers {
    constructor(public role: Role, public memberRoleStatuses: BirthdayMemberRoleStatus[]) {}
}

export class BirthdayMemberRoleStatus {
    constructor(public member: GuildMember, public give: Boolean) {}
}

export class MemberAnniversaryMessageGuildMembers {
    constructor(public memberAnniversaryChannel: TextChannel, public member: GuildMember[]) {}
}

export class MemberAnniversaryRoleGuildMembers {
    constructor(public memberAnniversaryRole: Role, public member: GuildMember[]) {}
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
