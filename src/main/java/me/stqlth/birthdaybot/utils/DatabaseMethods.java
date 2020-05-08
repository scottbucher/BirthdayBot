package me.stqlth.birthdaybot.utils;

import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import net.dv8tion.jda.api.entities.*;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

public class DatabaseMethods {

	public void updateBirthday(User user, String bday) throws SQLException {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 CallableStatement statement = conn.prepareCall("CALL UpdateBirthday(?, ?)")) {
			int userId;

			userId = getUserId(user);

			statement.setInt(1, userId);
			statement.setString(2, bday);

			statement.execute();
		}
	}

	public int getUserId(User user) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			ResultSet rs = statement.executeQuery("CALL GetUserId(" + user.getId() + ")");
			rs.next();
			return rs.getInt("UserId");
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return -1;
	}

	public void updateZoneId(CommandEvent event, String zoneId) throws SQLException {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 CallableStatement statement = conn.prepareCall("CALL UpdateZoneId(?, ?)")) {
			int userId;

			userId = getUserId(event.getAuthor());

			statement.setInt(1, userId);
			statement.setString(2, zoneId);

			statement.execute();
		}
	}

	public int getChangesLeft(User user) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			int userId = -1;

			userId = getUserId(user);

			ResultSet rs2 = statement.executeQuery("CALL GetChangesLeft(" + userId + ")");
			rs2.next();
			return rs2.getInt("ChangesLeft");

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return -1;
	}

	public void updateChangesLeft(CommandEvent event, int left) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 CallableStatement statement = conn.prepareCall("CALL UpdateChangesLeft(?, ?)")) {
			int userId;

			userId = getUserId(event.getAuthor());

			statement.setInt(1, userId);
			statement.setInt(2, left);

			statement.execute();
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
	}

	public String getUserBirthday(User user) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			int userId = -1;

			userId = getUserId(user);

			ResultSet rs2 = statement.executeQuery("CALL GetUserBirthday(" + userId + ")");
			rs2.next();
			return rs2.getString("Birthday");

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return "-1";
	}

	public String getUserBirthday(long userid) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			ResultSet rs2 = statement.executeQuery("CALL GetUserBirthdayFromDiscordId('" + userid + "')");
			rs2.next();

			String[] values = rs2.getString("Birthday").split("-");

			return values[1] + "-" + values[2];

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return "-1";
	}

	public ZoneId getUserZoneId(User user) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			int userId = -1;

			userId = getUserId(user);

			ResultSet rs2 = statement.executeQuery("CALL GetUserZoneId(" + userId + ")");
			rs2.next();
			return ZoneId.of(rs2.getString("ZoneId"));

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return null;
	}

	public String getGuildBirthdayMessage(Guild guild) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);

			ResultSet rs = statement.executeQuery("CALL GetGuildBirthdayMessage(" + guildSettingsId + ")");
			rs.next();
			return rs.getString("CustomMessage");

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return "0";
	}

	public void updateGuildMessageTime(Guild guild, int time) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 CallableStatement statement = conn.prepareCall("CALL UpdateMessageTime(?, ?)")) {

			int guildSettingsId = getGuildSettingsId(guild);

			statement.setInt(1, guildSettingsId);
			statement.setInt(2, time);

			statement.execute();
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
	}

	public int getGuildMessageTime(Guild guild) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);


			ResultSet rs = statement.executeQuery("CALL GetMessageTime(" + guildSettingsId + ")");
			rs.next();
			return rs.getInt("MessageTime");

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return 0;
	}

	public int getGuildSettingsId(Guild guild) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			ResultSet rs = statement.executeQuery("CALL GetGuildSettingsId(" + guild.getId() + ")");
			rs.next();
			return rs.getInt("GuildSettingsId");

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return 0;
	}

	public long getBirthdayChannel(Guild guild) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);


			ResultSet rs = statement.executeQuery("CALL GetBirthdayChannel(" + guildSettingsId + ")");
			rs.next();
			return rs.getLong("BirthdayChannel");

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return 0;
	}

	public long getBirthdayRole(Guild guild) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);


			ResultSet rs = statement.executeQuery("CALL GetBirthdayRole(" + guildSettingsId + ")");
			rs.next();
			return rs.getLong("BirthdayRole");

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return 0;
	}

	public List<User> getNextBirthdays(CommandEvent event, String userDiscordIds) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			List<User> birthdays = new ArrayList<>();
			String firstDate;
			ResultSet rs = statement.executeQuery("CALL GetNextBirthday1('" + userDiscordIds + "')");

			if (!rs.next()) {
				ResultSet rs2 = statement.executeQuery("CALL GetNextBirthday2('" + userDiscordIds + "')");
				if (!rs2.next()) return null;
				long temp2 = rs2.getLong("UserDiscordId");
				firstDate = getUserBirthday(temp2);
				rs2.beforeFirst();


				while (rs2.next()) {
					long temp = rs2.getLong("UserDiscordId");
					if (getUserBirthday(temp).equals(firstDate)) {
						birthdays.add(event.getJDA().getUserById(temp));
					} else if (!Utilities.isLeap(LocalDateTime.now().getYear()) && firstDate.equalsIgnoreCase("02-28") && getUserBirthday(temp).equals("02-29")) {
						birthdays.add(event.getJDA().getUserById(temp));
					} else {
						break;
					}
				}

			} else {
				long temp2 = rs.getLong("UserDiscordId");
				firstDate = getUserBirthday(temp2);
				rs.beforeFirst();

				while (rs.next()) {
					long temp = rs.getLong("UserDiscordId");
					if (getUserBirthday(temp).equals(firstDate)) {
						birthdays.add(event.getJDA().getUserById(temp));
					} else if (!Utilities.isLeap(LocalDateTime.now().getYear()) && firstDate.equalsIgnoreCase("02-28") && getUserBirthday(temp).equals("02-29")) {
						birthdays.add(event.getJDA().getUserById(temp));
					} else {
						break;
					}
				}
			}

			return birthdays;
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return null;
	}

	public long getTrustedRole(Guild guild) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);


			ResultSet rs = statement.executeQuery("CALL GetTrustedRole(" + guildSettingsId + ")");
			rs.next();
			return rs.getLong("TrustedRole");

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return 0;
	}

	public String getMentionSetting(Guild guild) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);


			ResultSet rs = statement.executeQuery("CALL GetMentionSetting(" + guildSettingsId + ")");
			rs.next();
			return rs.getString("MentionSetting");

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return "0";
	}

	public boolean getTrustedPreventMessage(Guild guild) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);


			ResultSet rs = statement.executeQuery("CALL GetTrustedPreventsMessage(" + guildSettingsId + ")");
			rs.next();
			return rs.getBoolean("TrustedPreventsMessage");

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return true;
	}

	public boolean getTrustedPreventRole(Guild guild) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(guild);


			ResultSet rs = statement.executeQuery("CALL GetTrustedPreventsRole(" + guildSettingsId + ")");
			rs.next();
			return rs.getBoolean("TrustedPreventsRole");

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return true;
	}


	public void updateBirthdayChannel(CommandEvent event, TextChannel bdayChannel) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 CallableStatement statement = conn.prepareCall("CALL UpdateBirthdayChannel(?, ?)")) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.setString(1, bdayChannel.getId());
			statement.setInt(2, guildSettingsId);

			statement.execute();
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
	}

	public void clearBirthdayChannel(CommandEvent event) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateBirthdayChannel(" + 0 + ", " + guildSettingsId + ")");
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
	}

	public void updateBirthdayRole(CommandEvent event, Role bdayRole) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 CallableStatement statement = conn.prepareCall("CALL UpdateBirthdayRole(?, ?)")) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.setString(1, bdayRole.getId());
			statement.setInt(2, guildSettingsId);

			statement.execute();
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
	}

	public void clearBirthdayRole(CommandEvent event) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateBirthdayRole(" + 0 + ", " + guildSettingsId + ")");
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
	}

	public void updateTrustedRole(CommandEvent event, Role tRole) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 CallableStatement statement = conn.prepareCall("CALL UpdateTrustedRole(?, ?)")) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.setString(1, tRole.getId());
			statement.setInt(2, guildSettingsId);

			statement.execute();
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
	}

	public void clearTrustedRole(CommandEvent event) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());

			statement.execute("CALL UpdateTrustedRole(" + 0 + ", " + guildSettingsId + ")");
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
	}

	public void updatePreventRole(CommandEvent event, int bool) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 CallableStatement statement = conn.prepareCall("CALL UpdatePreventRole(?, ?)")) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());


			statement.setInt(1, guildSettingsId);
			statement.setInt(2, bool);

			statement.execute();
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
	}

	public void updatePreventMessage(CommandEvent event, int bool) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 CallableStatement statement = conn.prepareCall("CALL UpdatePreventMessage(?, ?)")) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());


			statement.setInt(1, guildSettingsId);
			statement.setInt(2, bool);

			statement.execute();
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
	}

	public void updateUseEmbed(CommandEvent event, int bool) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 CallableStatement statement = conn.prepareCall("CALL UpdateUseEmbed(?, ?)")) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());


			statement.setInt(1, guildSettingsId);
			statement.setInt(2, bool);

			statement.execute();
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
	}

	public boolean getUseEmbed(Guild guild) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 CallableStatement statement = conn.prepareCall("CALL GetUseEmbed(?)")) {

			int guildSettingsId = getGuildSettingsId(guild);


			statement.setInt(1, guildSettingsId);

			ResultSet rs = statement.executeQuery();
			rs.next();
			return rs.getBoolean("UseEmbed");

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return true;
	}

	public void updateMessage(CommandEvent event, String message) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 CallableStatement statement = conn.prepareCall("CALL UpdateMessage(?, ?)")) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());


			statement.setInt(1, guildSettingsId);
			statement.setString(2, message);

			statement.execute();
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
	}

	public void updateMentionedSetting(CommandEvent event, String setting) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 CallableStatement statement = conn.prepareCall("CALL UpdateMentionSetting(?, ?)")) {

			int guildSettingsId = getGuildSettingsId(event.getGuild());


			statement.setInt(1, guildSettingsId);
			statement.setString(2, setting);

			statement.execute();
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
	}


	public boolean doesUserExist(User user) {

		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			ResultSet check = statement.executeQuery("CALL DoesUserAlreadyExist(" + user.getId() + ")");
			check.next();
			return check.getBoolean("AlreadyExists");

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return false;
	}

	public void addUser(User user) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {
			statement.execute("CALL InsertUser(" + user.getId() + ")");
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
	}

	public List<String> getBirthdays(String date) {

		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			List<String> birthdays = new ArrayList<>();
			ResultSet rs = statement.executeQuery("CALL GetBirthdays('" + date + "')");

			while (rs.next()) {
//				Logger.Debug("Retrieved user Birthday from database with ID: " + rs.getString("UserDiscordId"));
				birthdays.add(rs.getString("UserDiscordId"));
			}
			return birthdays;
		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}

		return null;
	}

}
