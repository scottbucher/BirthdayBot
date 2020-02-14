package me.stqlth.birthdaybot.utils;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.debug.DebugMessages;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.TextChannel;

import java.nio.channels.Channel;
import java.sql.*;

public class DatabaseMethods {

	private BirthdayBotConfig birthdayBotConfig;
	private DebugMessages debugMessages;

	public DatabaseMethods(BirthdayBotConfig birthdayBotConfig, DebugMessages debugMessages) {
		this.birthdayBotConfig = birthdayBotConfig;
		this.debugMessages = debugMessages;
	}

	public void updateBirthday (CommandEvent event, String bday) throws SQLException {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			int userId = -1;

			ResultSet rs = statement.executeQuery("CALL GetUserId(" + event.getMember().getUser().getId() + ")");
			rs.next();
			userId = rs.getInt("UserId");

			statement.execute("CALL UpdateBirthday(" + userId + ", '" + bday + "')");
		}
	}
	public void updateOffset (CommandEvent event, int offset) throws SQLException {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			int userId = -1;

			ResultSet rs = statement.executeQuery("CALL GetUserId(" + event.getMember().getUser().getId() + ")");
			rs.next();
			userId = rs.getInt("UserId");

			statement.execute("CALL UpdateOffset(" + userId + ", " + offset + ")");
		}
	}
	public int getChangesLeft(CommandEvent event) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			int userId = -1;

			ResultSet rs = statement.executeQuery("CALL GetUserId(" + event.getMember().getUser().getId() + ")");
			rs.next();
			userId = rs.getInt("UserId");

			ResultSet rs2 = statement.executeQuery("CALL GetChangesLeft(" + userId + ")");
			rs2.next();
			return rs2.getInt("ChangesLeft");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return -1;
	}
	public void updateChangesLeft (CommandEvent event, int left) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			int userId = -1;

			ResultSet rs = statement.executeQuery("CALL GetUserId(" + event.getMember().getUser().getId() + ")");
			rs.next();
			userId = rs.getInt("UserId");

			statement.execute("CALL UpdateChangesLeft(" + userId + ", " + left + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}
	public String getUserBirthday(Member member) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			int userId = -1;

			ResultSet rs = statement.executeQuery("CALL GetUserId(" + member.getId() + ")");
			rs.next();
			userId = rs.getInt("UserId");

			ResultSet rs2 = statement.executeQuery("CALL GetUserBirthday(" + userId + ")");
			rs2.next();
			return rs2.getString("Birthday");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return "-1";
	}
	public int getUserOffset(Member member) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			int userId = -1;

			ResultSet rs = statement.executeQuery("CALL GetUserId(" + member.getId() + ")");
			rs.next();
			userId = rs.getInt("UserId");

			ResultSet rs2 = statement.executeQuery("CALL GetUserOffset(" + userId + ")");
			rs2.next();
			return rs2.getInt("TimeOffset");

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
	public long getTrustedRole(CommandEvent event) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());


			ResultSet rs = statement.executeQuery("CALL GetTrustedRole(" + guildSettingsId + ")");
			rs.next();
			return rs.getLong("TrustedRole");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return 0;
	}
	public String getMentionSetting(CommandEvent event) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());


			ResultSet rs = statement.executeQuery("CALL GetMentionSetting(" + guildSettingsId + ")");
			rs.next();
			return rs.getString("MentionSetting");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return "0";
	}
	public boolean getTrustedPreventMessage(CommandEvent event) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());


			ResultSet rs = statement.executeQuery("CALL GetTrustedPreventsMessage(" + guildSettingsId + ")");
			rs.next();
			return rs.getBoolean("TrustedPreventsMessage");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return true;
	}
	public boolean getTrustedPreventRole(CommandEvent event) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());


			ResultSet rs = statement.executeQuery("CALL GetTrustedPreventsRole(" + guildSettingsId + ")");
			rs.next();
			return rs.getBoolean("TrustedPreventsRole");

		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
		return true;
	}
	public void updateBirthdayChannel (CommandEvent event, TextChannel bdayChannel) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateBirthdayChannel(" + bdayChannel.getId() + ", " + guildSettingsId + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}
	public void clearBirthdayChannel (CommandEvent event) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateBirthdayChannel(" + 0 + ", " + guildSettingsId + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}
	public void updateBirthdayRole (CommandEvent event, Role bdayRole) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateBirthdayRole(" + bdayRole.getId() + ", " + guildSettingsId + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}
	public void clearBirthdayRole (CommandEvent event) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateBirthdayRole(" + 0 + ", " + guildSettingsId + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}
	public void updateTrustedRole (CommandEvent event, Role bdayRole) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateTrustedRole(" + bdayRole.getId() + ", " + guildSettingsId + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}
	public void clearTrustedRole (CommandEvent event) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateTrustedRole(" + 0 + ", " + guildSettingsId + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}
	public void updatePreventRole (CommandEvent event, int bool) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdatePreventRole(" + guildSettingsId + ", " + bool + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}
	public void updatePreventMessage (CommandEvent event, int bool) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdatePreventMessage(" + guildSettingsId + ", " + bool + ")");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}
	public void updateMessage (CommandEvent event, String message) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateMessage(" + guildSettingsId + ", '" + message + "')");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}
	public void updateMentionedSetting (CommandEvent event, String setting) {
		try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateMentionSetting(" + guildSettingsId + ", '" + setting + "')");
		} catch (SQLException ex) {
			debugMessages.sqlDebug(ex);
		}
	}

}
