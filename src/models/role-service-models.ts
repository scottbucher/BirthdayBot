import { GuildMember, Role } from 'discord.js';

import { GuildCelebrationData } from './database';

export class RoleService {
    constructor(
        public guildCelebrationData: GuildCelebrationData,
        public celebrationMessages: CelebrationRole[]
    ) {}
}

export class CelebrationRole {
    role: Role;
    member: GuildMember;
}
