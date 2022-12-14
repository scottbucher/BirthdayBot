import {
    Entity,
    IdentifiedReference,
    Index,
    ManyToOne,
    OneToOne,
    PrimaryKey,
    Property,
    SerializedPrimaryKey,
} from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

import { GuildData } from './guild.js';
import { Message } from './index.js';

@Entity({ collection: 'events' })
@Index({ properties: ['guild'] })
export class Event {
    @PrimaryKey()
    _id!: ObjectId;

    @SerializedPrimaryKey()
    id!: string;

    @Property()
    guildDiscordId!: string;

    @Property()
    eventAlias?: string;

    @Property()
    date!: string;

    @Property()
    time = 0;

    @Property()
    mentionSetting = 0;

    @ManyToOne()
    guild!: IdentifiedReference<GuildData>;

    @OneToOne()
    message!: IdentifiedReference<Message>;
}
