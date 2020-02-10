package me.stqlth.birthdaybot.utils;

import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.debug.DebugMessages;
import net.dv8tion.jda.api.entities.Member;

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

}
