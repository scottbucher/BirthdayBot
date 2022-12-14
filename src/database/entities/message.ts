import {
    Entity,
    IdentifiedReference,
    Index,
    ManyToOne,
    OneToOne,
    PrimaryKey,
    Property,
    SerializedPrimaryKey,
    Unique,
} from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

import { Event, GuildData } from './index.js';

@Entity({ collection: 'messages' })
@Unique({ properties: ['guildDiscordId', 'name'] })
@Index({ properties: ['guildDiscordId'] })
@Index({ properties: ['channel'] })
export class Message {
    @PrimaryKey()
    _id!: ObjectId;

    @SerializedPrimaryKey()
    id!: string;

    @Property()
    guildDiscordId!: string;

    @Property()
    messageAlias?: string;

    @Property()
    type = 'birthday';

    @Property()
    descrption!: string;

    @Property()
    embedded!: boolean;

    @Property()
    color?: string;

    @Property()
    image?: string;

    @Property()
    title?: string;

    @Property()
    footer?: string;

    @ManyToOne()
    guild!: IdentifiedReference<GuildData>;

    @OneToOne()
    event!: IdentifiedReference<Event>;
}
