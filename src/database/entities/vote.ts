import { Entity, PrimaryKey, Property, SerializedPrimaryKey, Unique } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

import { TimeUtils } from '../../utils/index.js';

@Entity({ collection: 'votes' })
@Unique({ properties: ['botSiteName', 'userDiscordId', 'voteTime'] })
export class VoteData {
    // IDs
    @PrimaryKey()
    _id: ObjectId;

    @SerializedPrimaryKey()
    id!: string;

    // Data
    @Property()
    botSiteName!: string;

    @Property()
    userDiscordId!: string;

    // Times
    @Property()
    voteTime!: string;

    @Property()
    created = TimeUtils.now().toISO();

    constructor(botSiteName: string, userDiscordId: string, voteTime: string) {
        this.botSiteName = botSiteName;
        this.userDiscordId = userDiscordId;
        this.voteTime = voteTime;
    }
}
