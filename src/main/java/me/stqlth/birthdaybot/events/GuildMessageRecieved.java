package me.stqlth.birthdaybot.events;

import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.debug.DebugMessages;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.messages.getMethods.GetMessageInfo;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.events.message.guild.GuildMessageReceivedEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;

import javax.annotation.Nonnull;
import java.sql.*;
import java.time.LocalDate;
import java.time.Period;

public class GuildMessageRecieved extends ListenerAdapter {

	private BirthdayBotConfig birthdayBotConfig;
	private DebugMessages debugMessages;
	private BirthdayMessages birthdayMessages;

	public GuildMessageRecieved(BirthdayBotConfig birthdayBotConfig, DebugMessages debugMessages, BirthdayMessages birthdayMessages) {
		this.birthdayBotConfig = birthdayBotConfig;
		this.debugMessages = debugMessages;
		this.birthdayMessages = birthdayMessages;
	}

	@Override
	public void onGuildMessageReceived(@Nonnull GuildMessageReceivedEvent event) {

		String[] args = event.getMessage().getContentRaw().split(" ");

		if (args.length != 2) return;

		if (!args[0].equals("bday") || event.getMessage().getMentionedMembers().isEmpty()) return;

		Member member = event.getMessage().getMentionedMembers().get(0);

		String birthday = getUserBirthday(member);
		String[] values = birthday.split("-");
		int offset = getUserOffset(member);
		int day = Integer.parseInt(values[2]);
		int month = Integer.parseInt(values[1]);
		int year = Integer.parseInt(values[0]);

		String date = getMonth(month) + " " + day + ", " + year + " GMT" + offset;

		LocalDate birthDate = LocalDate.of(year, month, day);
		int age = calculateAge(birthDate, LocalDate.now());

		birthdayMessages.userBirthday(event.getChannel(), date, member, age);
	}


	private String getUserBirthday(Member member) {
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
	private int getUserOffset(Member member) {
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
	private static int calculateAge(LocalDate birthDate, LocalDate currentDate) {
		if ((birthDate != null) && (currentDate != null)) {
			return Period.between(birthDate, currentDate).getYears();
		} else {
			return 0;
		}
	}
	private static String getMonth(int month) {
		switch (month) {
			case 1:  return "January";
			case 2:  return "February";
			case 3:  return "March";
			case 4:  return "April";
			case 5:  return "May";
			case 6:  return "June";
			case 7:  return "July";
			case 8:  return "August";
			case 9:  return "September";
			case 10: return "October";
			case 11: return "November";
			case 12: return "December";
			default: return "Invalid month";
		}
	}

}
