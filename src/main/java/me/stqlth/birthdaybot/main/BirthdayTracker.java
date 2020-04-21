package me.stqlth.birthdaybot.main;

import me.stqlth.birthdaybot.utils.*;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.exceptions.PermissionException;
import net.dv8tion.jda.api.sharding.ShardManager;

import java.awt.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class BirthdayTracker {

	private DatabaseMethods db;

	public BirthdayTracker(DatabaseMethods databaseMethods) {
		this.db = databaseMethods;
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
				Utilities.getMsToNextHour(),
				// Once started, how often to repeat, in ms
				everyHour,
				// The unit of time for the above parameters
				TimeUnit.MILLISECONDS);
	}

	public void trackBirthdays(ShardManager client) {
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

		List<String> birthdaysString = db.getBirthdays(date);
		List<String> prevBirthdaysString = db.getBirthdays(prevDate);
		List<String> nextBirthdaysString = db.getBirthdays(nextDate);

		String leap = "02-29";
		if (!Utilities.isLeap(now.getYear())) { //Support for Leap day birthdays on non leap years
			if (now.getMonthValue() == 2 && now.getDayOfMonth() == 28) {
				birthdaysString.addAll(db.getBirthdays(leap));
			} else if (now.getMonthValue() == 3 && now.getDayOfMonth() == 1) {
				prevBirthdaysString.addAll(db.getBirthdays(leap));
			} else if (now.getMonthValue() == 2 && now.getDayOfMonth() == 27) {
				nextBirthdaysString.addAll(db.getBirthdays(leap));
			}
		}

		if (birthdaysString.isEmpty() && prevBirthdaysString.isEmpty() && nextBirthdaysString.isEmpty()) return;
		eventHandler(client, birthdaysString, prevBirthdaysString, nextBirthdaysString);
	}

	public void eventHandler(ShardManager client, List<String> bString, List<String> prevBString, List<String> nextBString) {
			Logger.Info("Birthday Event Triggered!");
			List<User> birthdayUsers = new ArrayList<>();

			for (String check : bString) {
				User user = client.getUserById(check);
				if (user == null) {
					Logger.Debug("User is null (ID: " + check + ")");
					continue;
				}

				birthdayUsers.add(user);
			}
			for (String check : prevBString) {
				User user = client.getUserById(check);
				if (user == null) {
					Logger.Debug("User is null (ID: " + check + ")");
					continue;
				}

				birthdayUsers.add(user);
			}
			for (String check : nextBString) {
				User user = client.getUserById(check);
				if (user == null) {
					Logger.Debug("User is null (ID: " + check + ")");
					continue;
				}

				birthdayUsers.add(user);
			}
			List<Guild> guilds = new ArrayList<>();

			for (User check : birthdayUsers)
				guilds.addAll(client.getMutualGuilds(check));

			for (Guild guild : guilds) {

				long bdayRole = db.getBirthdayRole(guild);
				long bdayChannel = db.getBirthdayChannel(guild);
				long trustedRole = db.getTrustedRole(guild);
				if (bdayRole == 0 && bdayChannel == 0) {
					Logger.Debug("Both bdayRole and channel are 0 in the database");
					continue; //if they are both not set, the birthday bot has nothing to do for this guild
				}

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

				if (bRole == null && bChannel == null) {
					Logger.Debug("Both birthday role and channel are null");
					continue; //if both return null the bot can't do anything for this guild on birthdays
				}

				List<Member> birthdaysExactInGuild = new ArrayList<>();
				List<Member> birthdaysExpiredExactInGuild = new ArrayList<>();
				List<Member> membersInGuild = new ArrayList<>();
				List<Member> BirthdayMessagesInGuild = new ArrayList<>();
				boolean preventRole = db.getTrustedPreventRole(guild);
				boolean preventChannel = db.getTrustedPreventMessage(guild);
				int messageTime = db.getGuildMessageTime(guild);

				for (Member check : guild.getMembers())
					if (birthdayUsers.contains(check.getUser()) && !check.getUser().isBot())
						membersInGuild.add(check);

				if (membersInGuild.isEmpty()) {
					Logger.Debug("membersInGuild is Empty");
					continue;
				}

				for (Member check : membersInGuild) { //GET EVERYONE WE WANT FOR EITHER THE ROLE ADD/REMOVE OR MESSAGE
					ZoneId zoneId = db.getUserZoneId(check.getUser());
					if (zoneId == null) continue;

					String birthday = db.getUserBirthday(check.getUser());
					String[] values = birthday.split("-");
					int day = Integer.parseInt(values[2]);
					int month = Integer.parseInt(values[1]);
					int year = Integer.parseInt(values[0]);
					int yearOffset = LocalDate.now().getYear() - year;

					Logger.Debug("Checking user: " + check.getUser().getName());

					LocalDateTime userBday = LocalDateTime.of(year, month, day, 0, 0).truncatedTo(ChronoUnit.HOURS);
					Logger.Debug("userBday: " + userBday.toString());
					LocalDateTime message = userBday.plusHours(messageTime).truncatedTo(ChronoUnit.HOURS);
					Logger.Debug("message: " + message.toString());
					LocalDateTime currentForUser = LocalDateTime.now(zoneId).minusYears(yearOffset).truncatedTo(ChronoUnit.HOURS);
					Logger.Debug("currentForUser: " + currentForUser.toString());
					LocalDateTime yesterdayForUser = currentForUser.minusDays(1).truncatedTo(ChronoUnit.HOURS);
					Logger.Debug("yesterdayForUser: " + yesterdayForUser.toString());

					if (userBday.isEqual(currentForUser)) {
						Logger.Debug("Give BirthdayRole to: " + check.getUser().getName());
						birthdaysExactInGuild.add(check);
					} else if (userBday.isEqual(yesterdayForUser)) {
						Logger.Debug("Take BirthdayRole from: " + check.getUser().getName());
						birthdaysExpiredExactInGuild.add(check);
					}
					if (message.isEqual(currentForUser)) {
						Logger.Debug("Send BirthdayMessage for: " + check.getUser().getName());
						BirthdayMessagesInGuild.add(check);
					}
				}

				if (bRole != null) {
					for (Member birthday : birthdaysExactInGuild) { //ADD ROLE AND ADD USER TO THE LIST OF PEOPLE TO SAY HAPPY BIRTHDAY TO

						if (preventRole && tRole != null) {
							if (!birthday.getRoles().contains(tRole)) {
								Logger.Debug("Bday Role: Trusted role is present and they do not have the role");
								continue;
							}
						}

						boolean hasTRole = birthday.getRoles().contains(tRole);

						if (!preventRole || hasTRole || tRole == null) {
							TextChannel temp = bChannel == null ? guild.getDefaultChannel() : bChannel;
							guild.addRoleToMember(birthday, bRole).queue(null, error -> {
									if (error instanceof PermissionException) {
										if (temp != null) {
											String message = "**BirthdayBot** can't give  " + birthday.getAsMention() + " the birthday role due to a lack of permissions!";
											EmbedSender.sendEmbed(temp, null, message, Color.RED);
										}
									} else {
										Logger.Error("Could not give the birthday role to " + birthday.getUser().getName() +
												"(" + birthday.getId() + ") in " + guild.getName() + "!", error);
									}
								});
						}
					}

					for (Member birthday : birthdaysExpiredExactInGuild) { //REMOVE THE ROLE IF THEIR BIRTHDAY HAS ENDED

						if (preventRole && tRole != null) {
							if (!birthday.getRoles().contains(tRole)) {
								Logger.Debug("Bday Remove Role: Trusted role is present and they do not have the role");
								continue;
							}
						}

						boolean hasTRole = birthday.getRoles().contains(tRole);

						if (!preventRole || hasTRole || tRole == null) {

							TextChannel temp = bChannel == null ? guild.getDefaultChannel() : bChannel;
							guild.removeRoleFromMember(birthday, bRole).queue(null, error -> {
									if (error instanceof PermissionException) {
										if (temp != null) {
											String message = "**BirthdayBot** can't take the birthday role from " + birthday.getAsMention() + " due to a lack of permissions!";
											EmbedSender.sendEmbed(temp, null, message, Color.RED);
										}
									} else {
										Logger.Error("Could not take the birthday role from " + birthday.getUser().getName() +
												"(" + birthday.getId() + ") in " + guild.getName() + "!", error);
									}
								});
						}
					}

				}

				if (bChannel != null) {
					for (Member birthday : BirthdayMessagesInGuild) {

						boolean hasTRole = birthday.getRoles().contains(tRole);

						if (preventChannel && tRole != null)
							if (!hasTRole) {
								BirthdayMessagesInGuild.remove(birthday);
								Logger.Debug("Bday Channel: Trusted role is present and they do not have the role");
							}
					}

					if (BirthdayMessagesInGuild.isEmpty()) {
						Logger.Info("BirthdayMessagesInGuild is empty");
						continue;
					}

					String roleMention = db.getMentionSetting(guild);
					Role mRole = null;
					try {
						mRole = guild.getRoleById(roleMention);
					} catch (Exception ignored) {
					}

					if (!roleMention.equalsIgnoreCase("0")) {
							if (mRole != null)
								bChannel.sendMessage(mRole.getAsMention()).queue(null, ErrorManager.GUILD_MESSAGE);
							else bChannel.sendMessage("@" + roleMention).queue(null, ErrorManager.GUILD_MESSAGE);
					}

					String customMessage = db.getGuildBirthdayMessage(guild);
					if (customMessage.equalsIgnoreCase("0")) {
						if (BirthdayMessagesInGuild.size() == 1) {
							Logger.Debug("Sent Birthday Message with size 1 to Guild: " + guild.getName());
							EmbedSender.sendEmbed(bChannel, null, "Happy Birthday to " + BirthdayMessagesInGuild.get(0).getAsMention() + "!", Color.decode("#1CFE86"));
							continue;
						}
						Logger.Debug("Sent Birthday Message with size " + BirthdayMessagesInGuild.size() + " to Guild: " + guild.getName());

						EmbedSender.sendEmbed(bChannel, null, "Happy Birthday to " + Utilities.getBirthdays(BirthdayMessagesInGuild) + "!", Color.decode("#1CFE86"));
						continue;
					}
					Logger.Debug("Sent Custom Birthday Message with size " + BirthdayMessagesInGuild.size() + " to Guild: " + guild.getName());

					customMessage = customMessage.replaceAll("@Users", Utilities.getBirthdays(BirthdayMessagesInGuild).toString());
					customMessage = customMessage.replaceAll("@users", Utilities.getBirthdays(BirthdayMessagesInGuild).toString());
					EmbedSender.sendEmbed(bChannel, null, customMessage, Color.decode("#1CFE86"));
				}

			}

	}
}

