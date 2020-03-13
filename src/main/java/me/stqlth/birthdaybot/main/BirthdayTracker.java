package me.stqlth.birthdaybot.main;

import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.Logger;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.sharding.ShardManager;
import org.apache.commons.collections4.ListUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Date;
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
				getMsToNextMinute(),
				// Once started, how often to repeat, in ms
				everyMinute,
				// The unit of time for the above parameters
				TimeUnit.MILLISECONDS);
	}

	public void trackBirthdays(ShardManager client, BirthdayMessages birthdayMessages) {
		Logger.Info("Tracking Birthdays...");

		LocalDateTime now = LocalDateTime.now();
		LocalDateTime previous = LocalDateTime.now().minusDays(1);

		int tempMonth = now.getMonthValue();
		String date;
		if (tempMonth < 10) date = "0" + now.getMonthValue() + "-" + now.getDayOfMonth();
		else date = now.getMonthValue() + "-" + now.getDayOfMonth();

		int tempPrevMonth = previous.getMonthValue();
		String prevDate;
		if (tempPrevMonth < 10) prevDate = "0" + previous.getMonthValue() + "-" + previous.getDayOfMonth();
		else prevDate = previous.getMonthValue() + "-" + previous.getDayOfMonth();

		List<String> birthdaysString = db.getBirthdays(date);
		List<String> finishedBirthdaysString = db.getBirthdays(prevDate);

		roleHandler(db, client, birthdaysString, finishedBirthdaysString, now);
		messageHandler(db, birthdayMessages, client, birthdaysString, finishedBirthdaysString, now);
	}

	private static void roleHandler(DatabaseMethods db, ShardManager client, List<String> birthdaysString, List<String> finishedBirthdaysString, LocalDateTime now) {
		if (birthdaysString.isEmpty() && finishedBirthdaysString.isEmpty()) return;

		List<User> birthdayUsers = new ArrayList<>();
		for (String check : birthdaysString)
			birthdayUsers.add(client.getUserById(check));

		List<User> finishedBirthdayUsers = new ArrayList<>();
		for (String check : finishedBirthdaysString)
			finishedBirthdayUsers.add(client.getUserById(check));

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
				if (birthdayUsers.contains(check.getUser()) && db.getUserUTCTime(check.getUser()) == now.getHour())
					birthdaysExactInGuild.add(check);
				else if (finishedBirthdayUsers.contains(check.getUser())) {
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

	private static void messageHandler(DatabaseMethods db, BirthdayMessages birthdayMessages, ShardManager client, List<String> birthdaysString, List<String> pBirthdaysString, LocalDateTime now) {
		if (birthdaysString.isEmpty() && pBirthdaysString.isEmpty()) return;

		List<User> birthdayUsers = new ArrayList<>();
		for (String check : birthdaysString)
			birthdayUsers.add(client.getUserById(check));


		List<User> pBirthdayUsers = new ArrayList<>();
		for (String check : pBirthdaysString)
			pBirthdayUsers.add(client.getUserById(check));


		List<User> allBirthdayUsers = ListUtils.union(birthdayUsers, pBirthdayUsers);

		List<Guild> guilds = client.getMutualGuilds(allBirthdayUsers);

		for (Guild guild : guilds) {

			long trustedRole = db.getTrustedRole(guild);
			long bdayChannel = db.getBirthdayChannel(guild);
			if (bdayChannel == 0) continue;


			Role tRole = null;
			TextChannel bChannel = null; //initialize the Role and TextChannel since at-least one exists


			try {
				tRole = guild.getRoleById(trustedRole);
			} catch (Exception ignored) {
			}
			try {
				bChannel = guild.getTextChannelById(bdayChannel);
			} catch (Exception ignored) {
			} //try to get said role/channel

			if (bChannel == null) continue; //if both return null the bot can't do anything for this guild on birthdays

			List<Member> membersInGuild = new ArrayList<>();
			List<Member> messageMembers = new ArrayList<>();

			for (Member check : guild.getMembers())
				if (birthdayUsers.contains(check.getUser()))
					membersInGuild.add(check);

			if (membersInGuild.isEmpty()) continue;


			int messageTime = db.getGuildMessageTime(guild);
			boolean preventChannel = db.getTrustedPreventMessage(guild);

			for (Member member : membersInGuild) {
				if (tRole != null && !member.getRoles().contains(tRole) && preventChannel) {
					continue;
				}

				String birthday = db.getUserBirthday(member.getUser());
				String[] values = birthday.split("-");
				String utcTime = String.valueOf(db.getUserUTCTime(member.getUser()));
				int utc = Integer.parseInt(utcTime);

				int day = Integer.parseInt(values[2]);
				int month = Integer.parseInt(values[1]);
				int year = Integer.parseInt(values[0]);

				LocalDate messageDate = LocalDate.of(year, month, day);

				utc += messageTime;
				if (utc > 23) {
					messageDate = messageDate.plusDays(1); //we increase this because this should now be the day of the message
					utc -= 24;
				}

				int nowHour = now.getHour();
				int nowDay = now.getDayOfMonth();
				int nowMonth = now.getMonthValue();
				int mHour = utc;
				int mDay = messageDate.getDayOfMonth();
				int mMonth = messageDate.getMonthValue();

				LocalDate nowDate = LocalDate.of(now.getYear(), nowMonth, nowDay);
				LocalDate mDate = LocalDate.of(now.getYear(), mMonth, mDay);

				if (mHour == nowHour && nowDate.equals(mDate)) {
					messageMembers.add(member);
					continue;
				}
			}



			if (messageMembers.isEmpty()) {
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
				if (messageMembers.size() == 1) {
					birthdayMessages.happyBirthday(bChannel, messageMembers.get(0));
					continue;
				}
				birthdayMessages.happyBirthdays(bChannel, messageMembers);
				continue;
			}
			birthdayMessages.customBirthdayMessage(bChannel, messageMembers, customMessage);

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

