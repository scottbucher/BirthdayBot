import {
    Entity,
    IdentifiedReference,
    Index,
    ManyToOne,
    PrimaryKey,
    Property,
    SerializedPrimaryKey,
    Unique,
} from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

import { RandomUtils } from '../../utils/index.js';
import { GuildData } from './guild.js';

@Entity({ collection: 'events' })
@Unique({ properties: ['guildDiscordId', 'alias'] })
@Unique({ properties: ['year', 'guildDiscordId'] })
@Index({ properties: ['guild'] })
export class MemberAnniversaryRoleData {
    @PrimaryKey()
    _id!: ObjectId;

    @SerializedPrimaryKey()
    id!: string;

    @Property()
    guildDiscordId!: string;

    @Property()
    alias = RandomUtils.friendlyId(6);

    @Property()
    role!: string;

    @Property()
    year!: number;

    @ManyToOne()
    guild!: IdentifiedReference<GuildData>;

    constructor(guildDiscordId: string, role: string, year: number) {
        this.guildDiscordId = guildDiscordId;
        this.role = role;
        this.year = year;
    }
}
