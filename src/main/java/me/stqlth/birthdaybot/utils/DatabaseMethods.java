package me.stqlth.birthdaybot.utils;

import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.debug.DebugMessages;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.events.guild.GuildLeaveEvent;
import net.dv8tion.jda.api.events.guild.member.GuildMemberJoinEvent;
import net.dv8tion.jda.api.events.guild.member.GuildMemberLeaveEvent;
import net.dv8tion.jda.api.sharding.ShardManager;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class DatabaseMethods {

	private BirthdayBotConfig birthdayBotConfig;
	private DebugMessages debugMessages;

	public DatabaseMethods(BirthdayBotConfig birthdayBotConfig, DebugMessages debugMessages) {
		this.birthdayBotConfig = birthdayBotConfig;
		this.debugMessages = debugMessages;
	}

	public void updateBirthday(User user, String bday) throws SQLException {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			int userId = -1;

			userId = getUserId(user);

			statement.execute("CALL UpdateBirthday(" + userId + ", '" + bday + "')");
		}
	}

	public int getUserId(User user) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			ResultSet rs = statement.executeQuery("CALL GetUserId(" + user.getId() + ")");
			rs.next();
			return rs.getInt("UserId");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return -1;
	}

	public void updateUTCTime(CommandEvent event, int offset) throws SQLException {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			int userId = -1;

			userId = getUserId(event.getAuthor());

			statement.execute("CALL UpdateUTCTime(" + userId + ", " + offset + ")");
		}
	}

	public int getChangesLeft(User user) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			int userId = -1;

			userId = getUserId(user);

			ResultSet rs2 = statement.executeQuery("CALL GetChangesLeft(" + userId + ")");
			rs2.next();
			return rs2.getInt("ChangesLeft");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return -1;
	}

	public void updateChangesLeft(CommandEvent event, int left) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			int userId = -1;

			userId = getUserId(event.getAuthor());

			statement.execute("CALL UpdateChangesLeft(" + userId + ", " + left + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

	public String getUserBirthday(User user) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			int userId = -1;

			userId = getUserId(user);

			ResultSet rs2 = statement.executeQuery("CALL GetUserBirthday(" + userId + ")");
			rs2.next();
			return rs2.getString("Birthday");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return "-1";
	}

	public int getUserUTCTime(User user) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			int userId = -1;

			userId = getUserId(user);

			ResultSet rs2 = statement.executeQuery("CALL GetUserUTCTime(" + userId + ")");
			rs2.next();
			return rs2.getInt("UTCTime");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return 0;
	}

	public String getGuildBirthdayMessage(Guild guild) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);

			ResultSet rs = statement.executeQuery("CALL GetGuildBirthdayMessage(" + guildSettingsId + ")");
			rs.next();
			return rs.getString("CustomMessage");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return "0";
	}

	public void updateGuildMessageTime(Guild guild, int time) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);
			statement.execute("CALL UpdateMessageTime(" + guildSettingsId + ", " + time + ")");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

	public int getGuildMessageTime(Guild guild) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);


			ResultSet rs = statement.executeQuery("CALL GetMessageTime(" + guildSettingsId + ")");
			rs.next();
			return rs.getInt("MessageTime");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return 0;
	}

	public int getGuildSettingsId(Guild guild) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			ResultSet rs = statement.executeQuery("CALL GetGuildSettingsId(" + guild.getId() + ")");
			rs.next();
			return rs.getInt("GuildSettingsId");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return 0;
	}

	public long getBirthdayChannel(Guild guild) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);


			ResultSet rs = statement.executeQuery("CALL GetBirthdayChannel(" + guildSettingsId + ")");
			rs.next();
			return rs.getLong("BirthdayChannel");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return 0;
	}

	public long getBirthdayRole(Guild guild) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);


			ResultSet rs = statement.executeQuery("CALL GetBirthdayRole(" + guildSettingsId + ")");
			rs.next();
			return rs.getLong("BirthdayRole");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return 0;
	}

	public long getTrustedRole(Guild guild) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);


			ResultSet rs = statement.executeQuery("CALL GetTrustedRole(" + guildSettingsId + ")");
			rs.next();
			return rs.getLong("TrustedRole");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return 0;
	}

	public String getMentionSetting(Guild guild) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);


			ResultSet rs = statement.executeQuery("CALL GetMentionSetting(" + guildSettingsId + ")");
			rs.next();
			return rs.getString("MentionSetting");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return "0";
	}

	public boolean getPreventAge(Guild guild) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);


			ResultSet rs = statement.executeQuery("CALL GetPreventAge(" + guildSettingsId + ")");
			rs.next();
			return rs.getBoolean("PreventAge");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return true;
	}

	public void updatePreventAge(CommandEvent event, int bool) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdatePreventAge(" + guildSettingsId + ", " + bool + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

	public boolean getHideAge(User user) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int UserId = getUserId(user);


			ResultSet rs = statement.executeQuery("CALL GetHideAge(" + UserId + ")");
			rs.next();
			return rs.getBoolean("HideAge");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return true;
	}

	public void updateHideAge(User user, int bool) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int UserId = getUserId(user);

			statement.execute("CALL UpdateHideAge(" + UserId + ", " + bool + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

	public boolean getTrustedPreventMessage(Guild guild) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);


			ResultSet rs = statement.executeQuery("CALL GetTrustedPreventsMessage(" + guildSettingsId + ")");
			rs.next();
			return rs.getBoolean("TrustedPreventsMessage");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return true;
	}

	public boolean getTrustedPreventRole(Guild guild) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);


			ResultSet rs = statement.executeQuery("CALL GetTrustedPreventsRole(" + guildSettingsId + ")");
			rs.next();
			return rs.getBoolean("TrustedPreventsRole");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return true;
	}

	public void updateBirthdayChannel(CommandEvent event, TextChannel bdayChannel) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateBirthdayChannel(" + bdayChannel.getId() + ", " + guildSettingsId + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

	public void clearBirthdayChannel(CommandEvent event) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateBirthdayChannel(" + 0 + ", " + guildSettingsId + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

	public void updateBirthdayRole(CommandEvent event, Role bdayRole) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateBirthdayRole(" + bdayRole.getId() + ", " + guildSettingsId + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

	public void clearBirthdayRole(CommandEvent event) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateBirthdayRole(" + 0 + ", " + guildSettingsId + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

	public void updateTrustedRole(CommandEvent event, Role bdayRole) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateTrustedRole(" + bdayRole.getId() + ", " + guildSettingsId + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

	public void clearTrustedRole(CommandEvent event) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateTrustedRole(" + 0 + ", " + guildSettingsId + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

	public void updatePreventRole(CommandEvent event, int bool) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdatePreventRole(" + guildSettingsId + ", " + bool + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

	public void updatePreventMessage(CommandEvent event, int bool) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdatePreventMessage(" + guildSettingsId + ", " + bool + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

	public void updateMessage(CommandEvent event, String message) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateMessage(" + guildSettingsId + ", '" + message + "')");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

	public void updateMentionedSetting(CommandEvent event, String setting) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateMentionSetting(" + guildSettingsId + ", '" + setting + "')");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

	public boolean guildActive(Guild g) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			ResultSet check = statement.executeQuery("CALL IsGuildActive(" + g.getId() + ")");
			check.next();
			boolean alreadyExists = check.getBoolean("Active");

			if (alreadyExists) return true;

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return false;
	}

	public int getGuildId(Guild guild) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			ResultSet rs = statement.executeQuery("CALL GetGuildId(" + guild.getId() + ")");
			rs.next();
			return rs.getInt("GuildId");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return -1;
	}

	public boolean doesUserExist(User user) {

		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			ResultSet check = statement.executeQuery("CALL DoesUserAlreadyExist(" + user.getId() + ")");
			check.next();
			return check.getBoolean("AlreadyExists");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return false;
	}

	public void addUser(User user) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			statement.execute("CALL InsertUser(" + user.getId() + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

	public List<String> getBirthdays(String date) {

		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			List<String> birthdays = new ArrayList<>();
			ResultSet rs = statement.executeQuery("CALL GetBirthdays('" + date + "')");

			while (rs.next()) {
				birthdays.add(rs.getString("UserDiscordId"));
				rs.next();
			}
			return birthdays;
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}

		return null;
	}

}
