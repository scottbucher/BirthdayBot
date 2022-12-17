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
    timeZone!: string;

    @Property()
    created = TimeUtils.now().toISO();

    constructor(userDiscordId: string, birthday: string, timeZone: string) {
        this.discordId = userDiscordId;
        this.timeZone = timeZone;

        this.birthdayStartUTC = TimeUtils.dateToUTC(birthday, timeZone).toISO();
        this.birthdayEndUTC = TimeUtils.dateToUTC(birthday, timeZone).plus({ days: 1 }).toISO();
    }
}
