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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
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
		Logger.Info("startTracker");

		ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

		// Create a new schedule
		scheduler.scheduleAtFixedRate(
				// Method to call on a schedule
				() -> {
					Logger.Info("Running trackBirthdays");
					trackBirthdays(client);
					Logger.Info("After trackBirthdays");
				},
				// How long to wait before starting, in ms
				// Calculates the time to the next exact Hour:
				getMsToNextHour(),
				// Once started, how often to repeat, in ms
				1000 * 60 * 60, //every hour
				// The unit of time for the above parameters
				TimeUnit.MILLISECONDS);


//		Calendar calendar = Calendar.getInstance();
//		int nextHour = calendar.get(Calendar.HOUR_OF_DAY) + 1; //12:00am is 0 - 23 which is 11pm
//		System.out.println(nextHour);
//
//		boolean s = true;
//
//		while (s) {
//			LocalTime cTime = LocalTime.now();
//			if (cTime.getHour() == nextHour) {
////				trackBirthdays(client, nextHour);
//				s = false;
//			}
//			Thread.sleep(1000);
////			System.out.println("Running the while loop");
//		}
	}

	public void trackBirthdays(ShardManager client) {
		System.out.println("Track Birthdays in start");

		List<Guild> guilds = client.getGuilds();
		if (guilds.isEmpty()) return;

		for (Guild guild : guilds) {
			System.out.println("Checking guild: " + guild.getName());

			long bdayRole = db.getBirthdayRole(guild);
			long bdayChannel = db.getBirthdayChannel(guild);
			if (bdayChannel == 0 && bdayRole == 0)
				continue; //if they are both not set, the birthday bot has nothing to do for this guild

			Role bRole = null;
			TextChannel bChannel = null; //initialize the Role and TextChannel since at-least one exists

			try {
				bRole = guild.getRoleById(bdayRole);
			} catch (NullPointerException ignored) {
			}
			try {
				bChannel = guild.getTextChannelById(bdayChannel);
			} catch (NullPointerException ignored) {
			} //try to get said role/channel
			if (bChannel == null && bRole == null)
				continue; //if both return null the bot can't do anything for this guild on birthdays

			System.out.println("Passed test"); //if all other requirements are passed they can enter the member loop
			List<Member> members = guild.getMembers();

			int guildMessageTime = db.getGuildMessageTime(guild);
			for (Member member : members) {
				if (member.getUser().isBot()) return;
				System.out.println("Checking member: " + member.getUser().getName() + " in guild: " + guild.getName());

				String bday = db.getUserBirthday(member);
				if (bday == null) continue; //if the member doesn't have a birthday ignore them
				System.out.println("Birthday was not null for " + member.getUser().getName());
				int botOffset = Integer.parseInt(bConfig.getBotOffset());
				int memberOffset = db.getUserOffset(member);
				int offsetDifference = botOffset - memberOffset;
				LocalDateTime now = LocalDateTime.now();
				now = now.minusHours(offsetDifference);


				if (!doesBirthdayEqualTodayAndTime(bday, now)) continue; //if it
				System.out.println(member.getUser().getName() + "'s birthday equals today and Time");


				if (bRole != null) {
					guild.addRoleToMember(member, bRole).queue();
					System.out.println("Give " + member.getUser().getName() + " the role");
				}
				if (bChannel != null && now.getHour() == guildMessageTime) {
					birthdayMessages.happyBirthday(bChannel, member);
				}

			}


		}

	}

	private static boolean doesBirthdayEqualTodayAndTime(String bday, LocalDateTime now) {
		String[] values = bday.split("-");
		int day = Integer.parseInt(values[2]);
		int month = Integer.parseInt(values[1]);
		int currentYear = Calendar.getInstance().get(Calendar.YEAR);

		LocalDateTime birthDay = LocalDateTime.of(currentYear, month, day, 0, 0);
		return now.equals(birthDay);
	}

	private static long getMsToNextHour() {
		// Calculates the exact time of the next whole second
		LocalDateTime nextHour = LocalDateTime.now().plusHours(1).truncatedTo(ChronoUnit.HOURS);
		// Calculates the number of milliseconds until the next second
		return LocalDateTime.now().until(nextHour, ChronoUnit.MILLIS);
	}
}

