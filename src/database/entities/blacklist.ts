import {
    Entity,
    IdentifiedReference,
    ManyToOne,
    PrimaryKey,
    Property,
    SerializedPrimaryKey,
    Unique,
} from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

import { GuildData } from './guild.js';

@Entity({ collection: 'blacklists' })
@Unique({ properties: ['discordId'] })
export class Blacklist {
    @PrimaryKey()
    _id!: ObjectId;

    @SerializedPrimaryKey()
    id!: string;

    @Property()
    discordId!: string;

    @ManyToOne()
    guild!: IdentifiedReference<GuildData>;
}
