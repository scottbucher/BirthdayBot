package me.stqlth.birthdaybot.main;

import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.Logger;
import me.stqlth.birthdaybot.utils.Utilities;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.sharding.ShardManager;
import org.apache.commons.collections4.ListUtils;

import javax.xml.crypto.Data;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class BirthdayTracker {

	private DatabaseMethods db;
	private BirthdayMessages birthdayMessages;

	public BirthdayTracker(DatabaseMethods databaseMethods, BirthdayMessages birthdayMessages) {
		this.db = databaseMethods;
		this.birthdayMessages = birthdayMessages;
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
					trackBirthdays(client, birthdayMessages);
				},
				// How long to wait before starting, in ms
				// Calculates the time to the next exact Hour:
				getMsToNextHour(),
				// Once started, how often to repeat, in ms
				everyHour,
				// The unit of time for the above parameters
				TimeUnit.MILLISECONDS);
	}

	public void trackBirthdays(ShardManager client, BirthdayMessages birthdayMessages) {
//		Logger.Info("Tracking Birthdays...");

		LocalDateTime now = LocalDateTime.now();
		LocalDateTime previous = now.minusDays(1);
		LocalDateTime next = now.plusDays(1);

		int tempMonth = now.getMonthValue();
		String date;
		if (tempMonth < 10) date = "0" + now.getMonthValue() + "-" + now.getDayOfMonth();
		else date = now.getMonthValue() + "-" + now.getDayOfMonth();

		int tempPrevMonth = previous.getMonthValue();
		String prevDate;
		if (tempPrevMonth < 10) prevDate = "0" + previous.getMonthValue() + "-" + previous.getDayOfMonth();
		else prevDate = previous.getMonthValue() + "-" + previous.getDayOfMonth();

		int tempNextMonth = next.getMonthValue();
		String nextDate;
		if (tempNextMonth < 10) nextDate = "0" + next.getMonthValue() + "-" + next.getDayOfMonth();
		else nextDate = next.getMonthValue() + "-" + next.getDayOfMonth();

//		Logger.Info("Date: " + date);
//		Logger.Info("PrevDate: " + prevDate);
//		Logger.Info("NextDate: " + nextDate);

		List<String> birthdaysString = db.getBirthdays(date);
		List<String> prevBirthdaysString = db.getBirthdays(prevDate);
		List<String> nextBirthdaysString = db.getBirthdays(nextDate);

		if (!Utilities.isLeap(now.getYear())) { //Support for Leap day birthdays on non leap years
			if (now.getMonthValue() == 2 && now.getDayOfMonth() == 28) {
				String leap = "02-29";
				birthdaysString.addAll(db.getBirthdays(leap));
			} else if (now.getMonthValue() == 3 && now.getDayOfMonth() == 1) {
				String leap = "02-29";
				prevBirthdaysString.addAll(db.getBirthdays(leap));
			} else if (now.getMonthValue() == 2 && now.getDayOfMonth() == 27) {
				String leap = "02-29";
				nextBirthdaysString.addAll(db.getBirthdays(leap));
			}
		}

		if (birthdaysString.isEmpty() && prevBirthdaysString.isEmpty() && nextBirthdaysString.isEmpty()) return;
		eventHandler(db, client, birthdayMessages, birthdaysString, prevBirthdaysString, nextBirthdaysString);
	}

	public static void eventHandler(DatabaseMethods db, ShardManager client, BirthdayMessages bMessages, List<String> bString, List<String> prevBString, List<String> nextBString) {
		List<User> birthdayUsers = new ArrayList<>();
		for (String check : bString)
			birthdayUsers.add(client.getUserById(check));

		for (String check : prevBString)
			birthdayUsers.add(client.getUserById(check));

		for (String check : nextBString)
			birthdayUsers.add(client.getUserById(check));


		List<Guild> guilds = client.getMutualGuilds(birthdayUsers);

		for (Guild guild : guilds) {

			long bdayRole = db.getBirthdayRole(guild);
			long bdayChannel = db.getBirthdayChannel(guild);
			long trustedRole = db.getTrustedRole(guild);
			if (bdayRole == 0 && bdayChannel == 0)
				continue; //if they are both not set, the birthday bot has nothing to do for this guild

			Role bRole = null;
			Role tRole = null;
			TextChannel bChannel = null;

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
			}

			if (bRole == null && bChannel == null)
				continue; //if both return null the bot can't do anything for this guild on birthdays

			List<Member> birthdaysExactInGuild = new ArrayList<>();
			List<Member> birthdaysExpiredExactInGuild = new ArrayList<>();
			List<Member> membersInGuild = new ArrayList<>();
			List<Member> birthdayMessagesInGuild = new ArrayList<>();
			boolean preventRole = db.getTrustedPreventRole(guild);
			boolean preventChannel = db.getTrustedPreventMessage(guild);
			int messageTime = db.getGuildMessageTime(guild);

			for (Member check : guild.getMembers())
				if (birthdayUsers.contains(check.getUser()) && !check.getUser().isBot())
					membersInGuild.add(check);

			if (membersInGuild.isEmpty()) continue;

			for (Member check : membersInGuild) { //GET EVERYONE WE WANT FOR EITHER THE ROLE ADD/REMOVE OR MESSAGE
				ZoneId zoneId = db.getUserZoneId(check.getUser());
				if (zoneId == null) continue;

				String birthday = db.getUserBirthday(check.getUser());
				String[] values = birthday.split("-");
				int day = Integer.parseInt(values[2]);
				int month = Integer.parseInt(values[1]);
				int year = Integer.parseInt(values[0]);
				int yearOffset = LocalDate.now().getYear() - year;

				LocalDateTime bday = LocalDateTime.of(year, month, day, 0, 0).truncatedTo(ChronoUnit.HOURS);
				LocalDateTime current = LocalDateTime.now(zoneId).minusYears(yearOffset).truncatedTo(ChronoUnit.HOURS);
				LocalDateTime message = current.plusHours(messageTime).truncatedTo(ChronoUnit.HOURS);
				LocalDateTime previous = LocalDateTime.now(zoneId).minusYears(yearOffset).minusDays(1).truncatedTo(ChronoUnit.HOURS);

				if (bday.isEqual(current)) birthdaysExactInGuild.add(check);
				else if (bday.isEqual(previous)) birthdaysExpiredExactInGuild.add(check);
				if (bday.isEqual(message)) birthdayMessagesInGuild.add(check);
			}

			if (bRole != null) {
				for (Member birthday : birthdaysExactInGuild) { //ADD ROLE AND ADD USER TO THE LIST OF PEOPLE TO SAY HAPPY BIRTHDAY TO

					if (preventRole && tRole != null)
						if (!birthday.getRoles().contains(tRole)) continue;

					boolean hasTRole = birthday.getRoles().contains(tRole);

					if (!preventRole || hasTRole || tRole == null) {
							guild.addRoleToMember(birthday, bRole).queue(null, (error) -> {});
					}
				}

				for (Member birthday : birthdaysExpiredExactInGuild) { //REMOVE THE ROLE IF THEIR BIRTHDAY HAS ENDED

					if (preventRole && tRole != null)
						if (!birthday.getRoles().contains(tRole)) {
							continue;
						}

					boolean hasTRole = birthday.getRoles().contains(tRole);

					if (!preventRole || hasTRole || tRole == null) {
							guild.removeRoleFromMember(birthday, bRole).queue(null, (error) -> {});
					}
				}

			}

			if (bChannel != null) {
				for (Member birthday : birthdayMessagesInGuild) { //REMOVE THE ROLE IF THEIR BIRTHDAY HAS ENDED

					if (preventChannel && tRole != null)
						if (!birthday.getRoles().contains(tRole)) {
							continue;
						}

					boolean hasTRole = birthday.getRoles().contains(tRole);

					if (preventChannel && !hasTRole && tRole != null) {
						birthdayMessagesInGuild.remove(birthday);
					}
				}

				if (birthdayMessagesInGuild.isEmpty()) continue;

				String roleMention = db.getMentionSetting(guild);
				Role mRole = null;
				try {
					mRole = guild.getRoleById(roleMention);
				} catch (Exception ignored) {
				}

				if (!roleMention.equalsIgnoreCase("0")) {
					if (mRole != null) bChannel.sendMessage(mRole.getAsMention()).queue(null, (error) -> {});
					else bChannel.sendMessage("@" + roleMention).queue(null, (error) -> {});
				}

				String customMessage = db.getGuildBirthdayMessage(guild);
				if (customMessage.equalsIgnoreCase("0")) {
					if (birthdayMessagesInGuild.size() == 1) {
						bMessages.happyBirthday(bChannel, birthdayMessagesInGuild.get(0));
						continue;
					}
					bMessages.happyBirthdays(bChannel, birthdayMessagesInGuild);
					continue;
				}
				bMessages.customBirthdayMessage(bChannel, birthdayMessagesInGuild, customMessage);

			}

		}

	}

	private static long getMsToNextHour() {
		// Calculates the exact time of the next whole second
		LocalDateTime nextHour = LocalDateTime.now().plusHours(1).truncatedTo(ChronoUnit.HOURS);
		// Calculates the number of milliseconds until the next second
		return LocalDateTime.now().until(nextHour, ChronoUnit.MILLIS) + 500;
	}

	private static long getMsToNextMinute() {
		// Calculates the exact time of the next whole second
		LocalDateTime nextMinute = LocalDateTime.now().plusMinutes(1).truncatedTo(ChronoUnit.MINUTES);
		// Calculates the number of milliseconds until the next second
		return LocalDateTime.now().until(nextMinute, ChronoUnit.MILLIS);
	}
}

