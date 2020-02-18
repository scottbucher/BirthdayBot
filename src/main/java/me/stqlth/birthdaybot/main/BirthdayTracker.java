package me.stqlth.birthdaybot.main;

import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.Logger;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.sharding.ShardManager;

import javax.management.relation.RoleNotFoundException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class BirthdayTracker {

	private DatabaseMethods db;
	private BirthdayMessages birthdayMessages;
	private BirthdayBotConfig bConfig;

	public BirthdayTracker(DatabaseMethods databaseMethods, BirthdayMessages birthdayMessages, BirthdayBotConfig birthdayBotConfig) {
		this.db = databaseMethods;
		this.birthdayMessages = birthdayMessages;
		this.bConfig = birthdayBotConfig;
	}

	public void startTracker(ShardManager client) {
		Logger.Info("Starting Birthday Tracker...");
		int everyMinute = 1000 * 60; //for testing
		int everyHour = 1000 * 60 * 60; //actual amount

		ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

		// Create a new schedule
		scheduler.scheduleAtFixedRate(
				// Method to call on a schedule
				() -> {
					trackBirthdays(client);
				},
				// How long to wait before starting, in ms
				// Calculates the time to the next exact Hour:
				getMsToNextHour(),
				// Once started, how often to repeat, in ms
				everyHour,
				// The unit of time for the above parameters
				TimeUnit.MILLISECONDS);
	}

	public void trackBirthdays(ShardManager client) {
		Logger.Info("Tracking Birthdays...");

		List<Guild> guilds = client.getGuilds();
		if (guilds.isEmpty()) return;

		for (Guild guild : guilds) {

			long bdayRole = db.getBirthdayRole(guild);
			long trustedRole = db.getTrustedRole(guild);
			long bdayChannel = db.getBirthdayChannel(guild);
			if (bdayChannel == 0 && bdayRole == 0)
				continue; //if they are both not set, the birthday bot has nothing to do for this guild

			Role bRole = null;
			Role tRole = null;
			TextChannel bChannel = null; //initialize the Role and TextChannel since at-least one exists

			try {
				bRole = guild.getRoleById(bdayRole);
			} catch (Exception ignored) {
			}
			try {
				tRole = guild.getRoleById(trustedRole);
			} catch (Exception ignored) {
			}
			try {
				bChannel = guild.getTextChannelById(bdayChannel);
			} catch (Exception ignored) {
			} //try to get said role/channel

			if (bChannel == null && bRole == null)
				continue; //if both return null the bot can't do anything for this guild on birthdays

			List<Member> members = guild.getMembers();

			int guildMessageTime = db.getGuildMessageTime(guild);
			List<Member> birthdays = new ArrayList<>();
			boolean preventRole = db.getTrustedPreventRole(guild);
			boolean preventChannel = db.getTrustedPreventMessage(guild);

			for (Member member : members) {

				if (member.getUser().isBot()) continue;

				if (preventChannel && preventRole && tRole != null)
					if (!member.getRoles().contains(tRole)) {
						continue;
					}

				boolean hasTRole = member.getRoles().contains(tRole);

				String bday = db.getUserBirthday(member);
				if (bday == null) continue; //if the member doesn't have a birthday ignore them
				int botOffset = Integer.parseInt(bConfig.getBotOffset());
				int memberOffset = db.getUserOffset(member);
				int offsetDifference = botOffset - memberOffset;
				LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES);
				now = now.minusHours(offsetDifference);

				if (doesBirthdayEqualTodayAndNotTime(bday, now, guildMessageTime)) {
					if (bChannel != null && now.getHour() == guildMessageTime && (!preventChannel || hasTRole || tRole == null)) {
						birthdays.add(member);
					}
				}

				if (doesBirthdayEqualTodayAndTime(bday, now)) {
					//check if its member's birthday

					if (bRole != null && (!preventRole || hasTRole || tRole == null)) {
						guild.addRoleToMember(member, bRole).queue();
					}
				} else if (doesBirthdayEqualYesterdayAndTime(bday, now) && bRole != null) {
					guild.removeRoleFromMember(member, bRole).queue();
				}

			}
			if (bChannel == null) {
				continue;
			} else if (birthdays.isEmpty()) {
				continue;
			}

			String roleMention = db.getMentionSetting(guild);
			Role mRole = null;
			try {
				mRole = guild.getRoleById(roleMention);
			} catch (Exception ignored) {
			}

			if (!roleMention.equalsIgnoreCase("0")) {
				if (mRole != null) bChannel.sendMessage(mRole.getAsMention()).queue();
				else bChannel.sendMessage("@" + roleMention).queue();
			}

			String customMessage = db.getGuildBirthdayMessage(guild);
			if (customMessage.equalsIgnoreCase("0")) {
				if (birthdays.size() == 1) {
					birthdayMessages.happyBirthday(bChannel, birthdays.get(0));
					continue;
				}
				birthdayMessages.happyBirthdays(bChannel, birthdays);
				continue;
			}
			birthdayMessages.customBirthdayMessage(bChannel, birthdays, customMessage);
		}

	}

	private static boolean doesBirthdayEqualTodayAndTime(String bday, LocalDateTime now) {
		String[] values = bday.split("-");
		int day = Integer.parseInt(values[2]);
		int month = Integer.parseInt(values[1]);
		int currentYear = Calendar.getInstance().get(Calendar.YEAR);

		LocalDateTime birthDay = LocalDateTime.of(currentYear, month, day, 0, now.getMinute());
		return now.equals(birthDay);
	}

	private static boolean doesBirthdayEqualTodayAndNotTime(String bday, LocalDateTime now, int hour) {
		String[] values = bday.split("-");
		int day = Integer.parseInt(values[2]);
		int month = Integer.parseInt(values[1]);
		int currentYear = Calendar.getInstance().get(Calendar.YEAR);

		LocalDateTime birthDay = LocalDateTime.of(currentYear, month, day, hour, now.getMinute());
		return now.equals(birthDay);
	}

	private static boolean doesBirthdayEqualYesterdayAndTime(String bday, LocalDateTime now) {
		now = now.minusDays(1);
		String[] values = bday.split("-");
		int day = Integer.parseInt(values[2]);
		int month = Integer.parseInt(values[1]);
		int currentYear = Calendar.getInstance().get(Calendar.YEAR);

		LocalDateTime birthDay = LocalDateTime.of(currentYear, month, day, 0, now.getMinute());
		return now.equals(birthDay);
	}

	private static long getMsToNextHour() {
		// Calculates the exact time of the next whole second
		LocalDateTime nextHour = LocalDateTime.now().plusHours(1).truncatedTo(ChronoUnit.HOURS);
		// Calculates the number of milliseconds until the next second
		return LocalDateTime.now().until(nextHour, ChronoUnit.MILLIS);
	}

	private static long getMsToNextMinute() {
		// Calculates the exact time of the next whole second
		LocalDateTime nextMinute = LocalDateTime.now().plusMinutes(1).truncatedTo(ChronoUnit.MINUTES);
		// Calculates the number of milliseconds until the next second
		return LocalDateTime.now().until(nextMinute, ChronoUnit.MILLIS);
	}
}

