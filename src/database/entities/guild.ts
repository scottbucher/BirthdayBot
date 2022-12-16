import {
    Cascade,
    Collection,
    Embeddable,
    Index,
    OneToMany,
    PrimaryKey,
    Property,
    Unique,
} from '@mikro-orm/core';
import { Embedded } from '@mikro-orm/core/decorators/Embedded.js';
import { Entity } from '@mikro-orm/core/decorators/Entity.js';
import { SerializedPrimaryKey } from '@mikro-orm/core/decorators/PrimaryKey.js';
import { ObjectId } from '@mikro-orm/mongodb';

import { DateFormat, LangCode, NameFormat, PostMode, UseTimeZone } from '../../enums/index.js';
import { TimeUtils } from '../../utils/time-utils.js';
import { EventData, MemberAnniversaryRoleData } from './index.js';
import { MessageData } from './message.js';

@Embeddable()
export class GuildSettings {
    @Property()
    language = LangCode.EN_US;

    @Property()
    timeZone?: string;
}

@Embeddable()
export class FormatSettings {
    @Property()
    name = NameFormat.MENTION;

    @Property()
    date = DateFormat.MONTH_DAY;
}

@Embeddable()
export class BirthdaySettings {
    @Property()
    channelDiscordId?: string;

    @Property()
    birthdayRoleDiscordId?: string;

    @Property()
    useTimeZone = UseTimeZone.SERVER;

    // Can't default to 0 since each server has a different timeZone
    // Calculated when server timeZone is set and useTimeZone is set to SERVER
    @Property()
    postHourUTC?: number;

    @Property()
    postMode = PostMode.POST_ONLY;

    @Property()
    mention?: string;

    @Property()
    reminderDaysBefore = 0;
}

@Embeddable()
export class MemberAnniversarySettings {
    @Property()
    channelDiscordId?: string;

    // Can't default to 0 since each server has a different timeZone
    // Calculated when server timeZone is set
    @Property()
    postHourUTC?: number;

    @Property()
    postMode = PostMode.POST_ONLY;

    @Property()
    mention?: string;
}

@Embeddable()
export class ServerAnniversarySettings {
    @Property()
    channelDiscordId?: string;

    // Can't default to 0 since each server has a different timeZone
    // Calculated when server timeZone is set
    @Property()
    postHourUTC?: number;

    @Property()
    postMode = PostMode.POST_ONLY;

    @Property()
    mention?: string;
}

@Embeddable()
export class EventSettings {
    @Property()
    channelDiscordId?: string;

    @Property()
    postMode = PostMode.POST_ONLY;

    @Property()
    mention?: string;
}

@Embeddable()
export class TrustedSystemSettings {
    @Property()
    roleIds: string[] = [];

    @Property()
    requireAll = true;

    @Property()
    requireForMessage = true;

    @Property()
    requireForRole = true;

    @Property()
    requireForMention = true;
}

@Embeddable()
export class BlacklistSettings {
    @Property()
    roleIds: string[] = [];

    @Property()
    userIds: string[] = [];
}

@Embeddable()
export class Premium {
    @Property()
    isPremium = false;

    @Property()
    lastCheck: string = TimeUtils.now().toISO();
}

@Entity({ collection: 'guilds' })
@Unique({ properties: ['discordId'] })
@Index({ properties: ['discordId'] })
export class GuildData {
    @PrimaryKey()
    _id!: ObjectId;

    @SerializedPrimaryKey()
    id!: string;

    @Property()
    discordId!: string;

    @Embedded({ object: true })
    guildSettings: GuildSettings = new GuildSettings();

    @Embedded({ object: true })
    birthdaySettings: BirthdaySettings = new BirthdaySettings();

    @Embedded({ object: true })
    memberAnniversarySettings: MemberAnniversarySettings = new MemberAnniversarySettings();

    @Embedded({ object: true })
    serverAnniversarySettings: ServerAnniversarySettings = new ServerAnniversarySettings();

    @Embedded({ object: true })
    eventSettings: EventSettings = new EventSettings();

    @Embedded({ object: true })
    trustedSystemSettings: TrustedSystemSettings = new TrustedSystemSettings();

    @Embedded({ object: true })
    blacklistSettings: BlacklistSettings = new BlacklistSettings();

    @Embedded({ object: true })
    premium: Premium = new Premium();

    @Property()
    created = TimeUtils.now().toISO();

    // @OneToMany
    @OneToMany(() => MessageData, message => message.guild, { cascade: [Cascade.ALL] })
    messages = new Collection<MessageData>(this);

    @OneToMany(() => EventData, event => event.guild, { cascade: [Cascade.ALL] })
    events = new Collection<EventData>(this);

    @OneToMany(() => MemberAnniversaryRoleData, mar => mar.guild, { cascade: [Cascade.ALL] })
    memberAnniversaryRoles = new Collection<EventData>(this);

    constructor(
        discordId: string,
        birthdayChannelDiscordId: string,
        birthdayRoleDiscordId: string
    ) {
        this.discordId = discordId;
        this.birthdaySettings.channelDiscordId = birthdayChannelDiscordId;
        this.birthdaySettings.birthdayRoleDiscordId = birthdayRoleDiscordId;
    }
}
