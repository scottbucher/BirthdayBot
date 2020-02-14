package me.stqlth.birthdaybot.main;

import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.sharding.ShardManager;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Calendar;
import java.util.List;

public class BirthdayTracker {

	private DatabaseMethods db;
	private BirthdayMessages birthdayMessages;

	public BirthdayTracker(DatabaseMethods databaseMethods, BirthdayMessages birthdayMessages) {
		this.db = databaseMethods;
		this.birthdayMessages = birthdayMessages;
	}

	public void startTracker(ShardManager client) throws InterruptedException {
		Calendar calendar = Calendar.getInstance();
		int nextHour = calendar.get(Calendar.HOUR_OF_DAY) + 1; //12:00am is 0 - 23 which is 11pm
		System.out.println(nextHour);

		boolean s = true;

		while (s) {
			LocalTime cTime = LocalTime.now();
			if (cTime.getHour() == nextHour) {
//				trackBirthdays(client, nextHour);
				s = false;
			}
			Thread.sleep(1000);
//			System.out.println("Running the while loop");
		}
	}

	public void trackBirthdays(ShardManager client, int nextHour) {

	}

	public void trackBirthdaysOld(ShardManager client, int hour) {
		while (true) {
			System.out.println("Running the hourlyTask");

			List<Guild> guilds = client.getGuilds();
			if (guilds.isEmpty()) return;

			for (Guild guild : guilds) {
				System.out.println("Checking guild: " + guild.getName());

				long bdayRole = db.getBirthdayRole(guild);
				long bdayChannel = db.getBirthdayChannel(guild);
				if (bdayChannel == 0 && bdayRole == 0) continue;

				Role bRole = null;
				TextChannel bChannel = null;

				try {
					bRole = guild.getRoleById(bdayRole);
				} catch (NullPointerException ignored) {
				}
				try {
					bChannel = guild.getTextChannelById(bdayChannel);
				} catch (NullPointerException ignored) {
				}

				System.out.println("Passed test");
				List<Member> members = guild.getMembers();

				for (Member check : members) {
					System.out.println("Checking member: " + check.getUser().getName() + " in guild: " + guild.getName());

					String bday = db.getUserBirthday(check);
					if (bday == null) {
						System.out.println("Bday was null");
						continue;
					}
					System.out.println("Bday was not null");
					LocalDate now = LocalDate.now();
					String[] values = bday.split("-");

					int day = Integer.parseInt(values[2]);
					int month = Integer.parseInt(values[1]);

					int currentYear = Calendar.getInstance().get(Calendar.YEAR);
					LocalDate birthDay = LocalDate.of(currentYear, month, day);

					int offset = db.getUserOffset(check);


					if ((hour-5) + offset != 24) {
						continue;
					}

					if (now.equals(birthDay)) {
						if (bRole != null) {
							guild.addRoleToMember(check, bRole).queue();
						}
						if (bChannel != null) {
							birthdayMessages.happyBirthday(bChannel, check);
						}
					}
				}
			}


			System.out.println("THE TIME NOW: " + LocalTime.now());
			System.out.println("THE HOUR NOW: " + LocalTime.now().getHour());


			try {
				Thread.sleep(1000 * 60 * 60);
			} catch (InterruptedException ignored) {
			}
		}

	}
}

