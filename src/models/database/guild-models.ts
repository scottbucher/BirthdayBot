export interface GuildData {
    GuildId: number;
    GuildDiscordId: string;
    BirthdayChannelDiscordId: string;
    BirthdayRoleDiscordId: string;
    BirthdayMentionSetting: string;
    MemberAnniversaryChannelDiscordId: string;
    ServerAnniversaryChannelDiscordId: string;
    MemberAnniversaryMentionSetting: string;
    ServerAnniversaryMentionSetting: string;
    BirthdayMessageTime: number;
    MemberAnniversaryMessageTime: number;
    ServerAnniversaryMessageTime: number;
    TrustedPreventsRole: number;
    TrustedPreventsMessage: number;
    NameFormat: string;
    DefaultTimezone: string;
    UseTimezone: string;
    RequireAllTrustedRoles: number;
    DateFormat: string;
}
