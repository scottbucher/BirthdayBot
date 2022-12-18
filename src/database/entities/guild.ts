import {
    Cascade,
    Collection,
    Embeddable,
    Embedded,
    Entity,
    OneToMany,
    PrimaryKey,
    Property,
    SerializedPrimaryKey,
    Unique,
} from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

import { DateFormat, LangCode, NameFormat, PostMode, UseTimeZone } from '../../enums/index.js';
import { TimeUtils } from '../../utils/time-utils.js';
import { CustomEventData, MemberAnniversaryRoleData, MessageData } from './index.js';

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

    addRoleId(roleId: string): void {
        this.roleIds = [...new Set([...this.roleIds, roleId])];
    }
}

@Embeddable()
export class BlacklistSettings {
    @Property()
    roleIds: string[] = [];

    @Property()
    userIds: string[] = [];

    addRoleId(roleId: string): void {
        this.roleIds = [...new Set([...this.roleIds, roleId])];
    }

    addUserId(userId: string): void {
        this.userIds = [...new Set([...this.userIds, userId])];
    }
}

@Embeddable()
export class Premium {
    @Property()
    active = false;

    @Property()
    lastCheck: string = TimeUtils.now().toISO();
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

    @OneToMany(() => CustomEventData, event => event.guild, { cascade: [Cascade.ALL] })
    events = new Collection<CustomEventData>(this);

    @OneToMany(() => MemberAnniversaryRoleData, mar => mar.guild, { cascade: [Cascade.ALL] })
    memberAnniversaryRoles = new Collection<MemberAnniversaryRoleData>(this);

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
