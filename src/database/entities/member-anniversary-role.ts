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

@Entity({ collection: 'memberAnniversaryRoles' })
@Unique({ properties: ['guild', 'alias'] })
@Unique({ properties: ['guild', 'year'] })
@Index({ properties: ['guild'] })
export class MemberAnniversaryRoleData {
    @PrimaryKey()
    _id!: ObjectId;

    @SerializedPrimaryKey()
    id!: string;

    @Property()
    alias = RandomUtils.friendlyId(6);

    @Property()
    discordId!: string;

    @Property()
    year!: number;

    @ManyToOne()
    guild!: IdentifiedReference<GuildData>;

    constructor(discordId: string, year: number) {
        this.discordId = discordId;
        this.year = year;
    }
}
