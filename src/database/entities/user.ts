import { Entity, PrimaryKey, Property, SerializedPrimaryKey, Unique } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

import { TimeUtils } from '../../utils/index.js';

@Entity({ collection: 'users' })
@Unique({ properties: ['discordId'] })
export class UserData {
    // IDs
    @PrimaryKey()
    _id: ObjectId;

    @SerializedPrimaryKey()
    id!: string;

    // Data
    @Property()
    discordId!: string;

    @Property()
    birthdayStartUTC!: string;

    @Property()
    birthdayEndUTC!: string;

    @Property()
    timezone!: string;

    @Property()
    created = TimeUtils.now().toISO();

    constructor(userDiscordId: string, birthday: string, timezone: string) {
        this.discordId = userDiscordId;
        this.timezone = timezone;

        this.birthdayStartUTC = TimeUtils.dateToUTC(birthday, timezone).toISO();
        this.birthdayEndUTC = TimeUtils.dateToUTC(birthday, timezone).plus({ days: 1 }).toISO();
    }
}
