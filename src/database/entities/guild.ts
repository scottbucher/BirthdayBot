import { Embeddable, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { Embedded } from '@mikro-orm/core/decorators/Embedded.js';
import { Entity } from '@mikro-orm/core/decorators/Entity.js';
import { SerializedPrimaryKey } from '@mikro-orm/core/decorators/PrimaryKey.js';
import { ObjectId } from '@mikro-orm/mongodb';

import { TimeUtils } from '../../utils/time-utils.js';

@Embeddable()
export class GuildSettings {
    @Property()
    timeZone!: string;

    @Property()
    useTimezone = 'server';

    @Property()
    nameFormat = 'mention';

    @Property()
    dateFormat = 'month_day';

    @Property()
    birthdayRoleDiscordId = '0';

    @Property()
    birthdayChannelDiscordId = '0';

    @Property()
    memberAnniversaryChannelDiscordId = '0';

    @Property()
    serverAnniversaryChannelDiscordId = '0';

    @Property()
    customEventChannelDiscordId = '0';

    @Property()
    birthdayMentionSetting = 0;

    @Property()
    memberAnniversaryMentionSetting = 0;

    @Property()
    serverAnniversaryMentionSetting = 0;

    @Property()
    birthdayMessageTime = 0;

    @Property()
    memberAnniversaryMessageTime = 0;

    @Property()
    serverAnniversaryMessageTime = 0;

    @Property()
    birthdayPostSetting = 'POST_ONLY';

    @Property()
    memberAnniversaryPostSetting = 'POST_ONLY';

    @Property()
    serverAnniversaryPostSetting = 'POST_ONLY';

    @Property()
    customEventPostSetting = 'POST_ONLY';

    @Property()
    daysBeforeBirthdayReminder = 0;

    @Property()
    trustedPreventsMessage = true;

    @Property()
    trustedPreventsRole = true;

    @Property()
    trustedPreventsMention = true;

    @Property()
    requireAllTrustedRoles = true;
}

@Embeddable()
export class Premium {
    @Property()
    isPremium = false;

    @Property()
    lastCheck: string = TimeUtils.now().toISOString();
}

@Entity({ collection: 'guilds' })
@Unique({ properties: ['discordId'] })
export class GuildData {
    @PrimaryKey()
    _id!: ObjectId;

    @SerializedPrimaryKey()
    id!: string;

    @Property()
    discordId!: string;

    @Embedded({ object: true })
    settings: GuildSettings = new GuildSettings();

    @Embedded({ object: true })
    premium: Premium = new Premium();

    @Property()
    created = TimeUtils.now().toISOString();

    // @OneToMany

    constructor(
        discordId: string,
        birthdayChannelDiscordId: string,
        birthdayRoleDiscordId: string
    ) {
        this.discordId = discordId;
        this.settings.birthdayChannelDiscordId = birthdayChannelDiscordId;
        this.settings.birthdayRoleDiscordId = birthdayRoleDiscordId;
    }
}
