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

import { MessageType } from '../../enums/message-type.js';
import { RandomUtils } from '../../utils/index.js';
import { EventData, GuildData } from './index.js';

@Entity({ collection: 'messages' })
@Unique({ properties: ['guildDiscordId', 'alias'] })
@Index({ properties: ['guildDiscordId'] })
@Index({ properties: ['channel'] })
export class MessageData {
    @PrimaryKey()
    _id!: ObjectId;

    @SerializedPrimaryKey()
    id!: string;

    @Property()
    guildDiscordId!: string;

    @Property()
    eventId?: string;

    @Property()
    alias = RandomUtils.friendlyId(6);

    @Property()
    descrption!: string;

    @Property()
    type = MessageType.BIRTHDAY;

    @Property()
    embedded = true;

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

    // Not all messages are tied to an event
    @OneToOne(() => EventData, event => event.messageId, { owner: false })
    event?: IdentifiedReference<EventData>;

    constructor(
        guildDiscordId: string,
        description: string,
        type?: MessageType,
        embedded?: boolean,
        color?: string,
        image?: string,
        title?: string,
        footer?: string
    ) {
        this.guildDiscordId = guildDiscordId;
        this.descrption = description;
        this.type = type;
        this.embedded = embedded;
        this.color = color;
        this.image = image;
        this.title = title;
        this.footer = footer;
    }
}
