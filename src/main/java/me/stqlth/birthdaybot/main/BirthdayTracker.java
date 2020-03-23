package me.stqlth.birthdaybot.main;

import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.Logger;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.sharding.ShardManager;
import org.apache.commons.collections4.ListUtils;

import javax.xml.crypto.Data;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class NewBirthdayTracker {

	private DatabaseMethods db;
	private BirthdayMessages birthdayMessages;

	public NewBirthdayTracker(DatabaseMethods databaseMethods, BirthdayMessages birthdayMessages) {
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
		Logger.Info("Tracking Birthdays...");

		LocalDateTime now = LocalDateTime.now();
		LocalDateTime previous = LocalDateTime.now().minusDays(1);
		LocalDateTime next = LocalDateTime.now().minusDays(1);

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

		List<String> birthdaysString = db.getBirthdays(date);
		List<String> prevBirthdaysString = db.getBirthdays(prevDate);
		List<String> nextBirthdaysString = db.getBirthdays(nextDate);

		roleHandler(db, client, birthdaysString, prevBirthdaysString, nextBirthdaysString);

	}

	public static void roleHandler(DatabaseMethods db, ShardManager client, List<String> bString, List<String> prevBString, List<String> nextBString) {
		if (bString.isEmpty() && prevBString.isEmpty() && nextBString.isEmpty()) return;


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
			long trustedRole = db.getTrustedRole(guild);
			if (bdayRole == 0)
				continue; //if they are both not set, the birthday bot has nothing to do for this guild

			Role bRole = null;
			Role tRole = null;

			try {
				bRole = guild.getRoleById(bdayRole);
			} catch (Exception ignored) {
			}
			try {
				tRole = guild.getRoleById(trustedRole);
			} catch (Exception ignored) {
			}

			if (bRole == null)
				continue; //if both return null the bot can't do anything for this guild on birthdays

			List<Member> birthdaysExactInGuild = new ArrayList<>();
			List<Member> birthdaysExpiredExactInGuild = new ArrayList<>();
			boolean preventRole = db.getTrustedPreventRole(guild);

			for (Member check : guild.getMembers()) {
				ZoneId zoneId = db.getUserZoneId(check.getUser());
				if (zoneId == null) continue;

				LocalDateTime bday = LocalDateTime.now(zoneId);
				LocalDateTime current = LocalDateTime.now();
				LocalDateTime previous = LocalDateTime.now().minusDays(1);

				if (bday.isEqual(current)) {
					birthdaysExactInGuild.add(check);
				} else if (bday.isEqual(previous)) {
					birthdaysExpiredExactInGuild.add(check);
				}

				for (Member birthday : birthdaysExactInGuild) { //ADD ROLE AND ADD USER TO THE LIST OF PEOPLE TO SAY HAPPY BIRTHDAY TO

					if (birthday.getUser().isBot()) continue;

					if (preventRole && tRole != null)
						if (!birthday.getRoles().contains(tRole)) {
							continue;
						}

					boolean hasTRole = birthday.getRoles().contains(tRole);

					if (!preventRole || hasTRole || tRole == null) {
						try {
							guild.addRoleToMember(birthday, bRole).queue();
						} catch (Exception ignored) {
						}
					}

				}

				for (Member birthday : birthdaysExpiredExactInGuild) { //REMOVE THE ROLE IF THEIR BIRTHDAY HAS ENDED

					if (birthday.getUser().isBot()) continue;

					if (preventRole && tRole != null)
						if (!birthday.getRoles().contains(tRole)) {
							continue;
						}

					boolean hasTRole = birthday.getRoles().contains(tRole);

					if (!preventRole || hasTRole || tRole == null) {
						try {
							guild.removeRoleFromMember(birthday, bRole).queue();
						} catch (Exception ignored) {
						}
					}
				}
			}


		}


	}

	public static void messageHandler(DatabaseMethods db, BirthdayMessages bMessages, ShardManager client, List<String> bString, List<String> prevBString, List<String> nextBString) {

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

