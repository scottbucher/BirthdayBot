INSERT INTO birthdaybotdev.user (
    UserId,
    UserDiscordId,
    Birthday,
    TimeZone,
    ChangesLeft
)
SELECT
    UserId,
    UserDiscordId,
    Birthday,
    ZoneId,
    ChangesLeft
FROM oldbirthdaybot.users;

DROP TEMPORARY TABLE IF EXISTS birthdaybotdev.GuildData;
CREATE TEMPORARY TABLE IF NOT EXISTS birthdaybotdev.GuildData AS
    SELECT
        G.DiscordId,
        GS.*
	FROM oldbirthdaybot.`guildsettings` AS GS
	JOIN oldbirthdaybot.`guild` AS G
    	ON GS.GuildSettingsId = G.GuildSettingsId;

INSERT INTO birthdaybotdev.guild (
    GuildDiscordId,
    BirthdayChannelDiscordId,
    BirthdayRoleDiscordId,
    TrustedRoleDiscordId,
    MentionSetting,
    MessageTime,
    TrustedPreventsRole,
    TrustedPreventsMessage,
    UseEmbed
) SELECT
    DiscordId,
    BirthdayChannel,
    BirthdayRole,
    TrustedRole,
    MentionSetting,
    MessageTime,
    TrustedPreventsRole,
    TrustedPreventsMessage,
    UseEmbed
FROM birthdaybotdev.GuildData;

INSERT INTO birthdaybotdev.messages (
	GuildId,
	Message
) SELECT
	GuildId,
	CustomMessage
FROM (
	SELECT
        G.GuildId,
        LEFT(GD.CustomMessage, 300) AS CustomMessage
	FROM birthdaybotdev.GuildData AS GD
	JOIN birthdaybotdev.guild AS G
		ON GD.DiscordId = G.GuildDiscordId
	WHERE GD.CustomMessage <> '0'
) AS NewData;

DROP TEMPORARY TABLE IF EXISTS birthdaybotdev.GuildData;