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

import { CelebrationType } from '../../enums/celebration-type.js';
import { RandomUtils } from '../../utils/index.js';
import { CustomEventData, GuildData } from './index.js';

@Entity({ collection: 'messages' })
@Unique({ properties: ['guild', 'alias'] })
@Index({ properties: ['guild'] })
export class MessageData {
    @PrimaryKey()
    _id!: ObjectId;

    @SerializedPrimaryKey()
    id!: string;

    @Property()
    alias = RandomUtils.friendlyId(6);

    @Property()
    description!: string;

    @Property()
    type = CelebrationType.BIRTHDAY;

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
    @OneToOne(() => CustomEventData, event => event.message, { owner: false })
    event?: IdentifiedReference<CustomEventData>;

    constructor(description: string, options?: MessageOptions) {
        this.description = description;
        this.type = options?.type ?? CelebrationType.BIRTHDAY;
        this.embedded = options?.embedded ?? true;
        this.color = options?.color;
        this.image = options?.image;
        this.title = options?.title;
        this.footer = options?.footer;
    }
}

export interface MessageOptions {
    type?: CelebrationType;
    embedded?: boolean;
    color?: string;
    image?: string;
    title?: string;
    footer?: string;
}
