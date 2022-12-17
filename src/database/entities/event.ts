import {
    Embeddable,
    Embedded,
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

import { RandomUtils } from '../../utils/index.js';
import { GuildData } from './guild.js';
import { MessageData } from './index.js';

@Embeddable()
export class TimeSettings {
    @Property()
    year?: number;

    @Property()
    month!: number;

    @Property()
    day!: number;

    @Property()
    hour = 0;
}

@Entity({ collection: 'events' })
@Unique({ properties: ['guild', 'alias'] })
@Index({ properties: ['guild'] })
export class EventData {
    @PrimaryKey()
    _id!: ObjectId;

    @SerializedPrimaryKey()
    id!: string;

    @Property()
    alias = RandomUtils.friendlyId(6);

    @Embedded({ object: true })
    timeSettings: TimeSettings = new TimeSettings();

    @Property()
    mention?: string;

    @ManyToOne()
    guild!: IdentifiedReference<GuildData>;

    // You assign a message to an event after the event is created
    @OneToOne(() => MessageData, message => message.event, { owner: true })
    message?: IdentifiedReference<MessageData>;

    constructor(month: number, day: number, year?: number, mention?: string) {
        this.timeSettings.month = month;
        this.timeSettings.day = day;
        this.timeSettings.year = year;
        this.mention = mention;
    }
}
