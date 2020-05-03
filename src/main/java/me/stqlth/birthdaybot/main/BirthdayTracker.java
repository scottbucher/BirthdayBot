package me.stqlth.birthdaybot.main;

import me.stqlth.birthdaybot.utils.*;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.exceptions.PermissionException;
import net.dv8tion.jda.api.sharding.ShardManager;

import java.awt.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

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
		Logger.Debug("Tracking Birthdays...");
		try {

			LocalDateTime now = LocalDateTime.now();
			LocalDateTime previous = now.minusDays(1);
			LocalDateTime next = now.plusDays(1);

			String month = (now.getMonthValue() < 10) ? "0" + now.getMonthValue() : String.valueOf(now.getMonthValue());
			String day = (now.getDayOfMonth() < 10) ? "0" + now.getDayOfMonth() : String.valueOf(now.getDayOfMonth());
			String date = month + "-" + day;

			String prevMonth = (previous.getMonthValue() < 10) ? "0" + previous.getMonthValue() : String.valueOf(previous.getMonthValue());
			String prevDay = (previous.getDayOfMonth() < 10) ? "0" + previous.getDayOfMonth() : String.valueOf(previous.getDayOfMonth());
			String prevDate = prevMonth + "-" + prevDay;

			String nextMonth = (next.getMonthValue() < 10) ? "0" + next.getMonthValue() : String.valueOf(next.getMonthValue());
			String nextDay = (next.getDayOfMonth() < 10) ? "0" + next.getDayOfMonth() : String.valueOf(next.getDayOfMonth());
			String nextDate = nextMonth + "-" + nextDay;

			Logger.Debug("date: " + date);
			Logger.Debug("prevDate: " + prevDate);
			Logger.Debug("nextDate: " + nextDate);

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

		} catch (Exception ex) {
			Logger.Error("The TrackBirthdays Method Caught an Exception.", ex);
		}

	}

	public void eventHandler(ShardManager client, List<String> bString, List<String> prevBString, List<String> nextBString) {
			Logger.Info("Birthday Event Triggered!");
			List<Guild> guilds = new ArrayList<>();
			List<User> birthdayUsers = new ArrayList<>();

			try {

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

				for (User check : birthdayUsers) { //creates possible duplicate guilds in this list
					guilds.addAll(client.getMutualGuilds(check));
				}

				guilds = guilds.stream().distinct().collect(Collectors.toList());


			} catch (Exception ex) {
				Logger.Error("The Birthday Tracker Setup Caught an Exception", ex);
			}


			try { //try catch for Guild Loop

				for (Guild guild : guilds) {

					long bdayRole = db.getBirthdayRole(guild);
					long bdayChannel = db.getBirthdayChannel(guild);
					long trustedRole = db.getTrustedRole(guild);
					boolean useEmbed = db.getUseEmbed(guild);
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

					try {

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

					} catch (Exception ex) {
						Logger.Error("The MembersInGuild Loop Caught an Exception.", ex);
					}


					try {

						EnumSet<Permission> reqRole = EnumSet.of(Permission.MANAGE_ROLES);
						if (bRole != null && guild.getSelfMember().hasPermission(reqRole)) {
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

					} catch (Exception ex) {
						Logger.Error("The Birthday Role Setter Caught an Exception.", ex);
					}

					try {
						EnumSet<Permission> req = EnumSet.of(Permission.MESSAGE_WRITE, Permission.MESSAGE_READ);

						if (bChannel != null && guild.getSelfMember().hasPermission(req)) {
							for (Member birthday : BirthdayMessagesInGuild) {

								boolean hasTRole = birthday.getRoles().contains(tRole);

								if (preventChannel && tRole != null)
									if (!hasTRole) {
										BirthdayMessagesInGuild.remove(birthday);
										Logger.Debug("Bday Channel: Trusted role is present and they do not have the role");
									}
							}

							if (BirthdayMessagesInGuild.isEmpty()) {
								Logger.Debug("BirthdayMessagesInGuild is empty");
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
									bChannel.sendMessage(mRole.getAsMention()).queue(null, error -> {
										if (!(error instanceof PermissionException || error instanceof IllegalArgumentException)) {
											Logger.Error("Birthday Bot was unable to send the birthday message to " + guild.getName() + " (" + guild.getId() + ")");
										}
									});
								else bChannel.sendMessage("@" + roleMention).queue(null, error -> {
									if (!(error instanceof PermissionException || error instanceof IllegalArgumentException)) {
										Logger.Error("Birthday Bot was unable to send the birthday message to " + guild.getName() + " (" + guild.getId() + ")");
									}
								});
							}

							String customMessage = db.getGuildBirthdayMessage(guild);
							if (customMessage.equalsIgnoreCase("0")) {
								if (BirthdayMessagesInGuild.size() == 1) { //ONLY ONE PERSON IN BIRTHDAY MESSAGE
									Logger.Debug("Sent Birthday Message with size 1 to Guild: " + guild.getName());

									/////////////////Send birthday message with single birthday
									if (useEmbed) { //CHECK IF THE GUILD WANTS AN EMBED
										EmbedSender.sendEmbed(bChannel, null, "Happy Birthday to " + BirthdayMessagesInGuild.get(0).getAsMention() + "!", Color.decode("#1CFE86"));
									} else {
										try { //catch any unforeseen errors
											TextChannel finalBChannel = bChannel;
											bChannel.sendMessage("Happy Birthday to " + BirthdayMessagesInGuild.get(0).getAsMention() + "!").queue(null, error -> {
												if (!(error instanceof PermissionException)) {
													Logger.Error("Failed to send message to a TextChannel with ID: " + finalBChannel.getId(), error);
												}
											});
										} catch (Exception ignored) {}
									}
									/////////////////


										continue;
								}
								Logger.Debug("Sent Birthday Message with size " + BirthdayMessagesInGuild.size() + " to Guild: " + guild.getName());
								/////////////////Send birthday message to multiple people
								if (useEmbed) {
									EmbedSender.sendEmbed(bChannel, null, "Happy Birthday to " + Utilities.getBirthdays(BirthdayMessagesInGuild) + "!", Color.decode("#1CFE86"));
								} else {
									try { //catch any unforeseen errors
										TextChannel finalBChannel = bChannel;
										bChannel.sendMessage("Happy Birthday to " + Utilities.getBirthdays(BirthdayMessagesInGuild) + "!").queue(null, error -> {
											if (!(error instanceof PermissionException)) {
												Logger.Error("Failed to send message to a TextChannel with ID: " + finalBChannel.getId(), error);
											}
										});
									} catch (Exception ignored) {}
								}
								/////////////////
								continue;
							}
							Logger.Debug("Sent Custom Birthday Message with size " + BirthdayMessagesInGuild.size() + " to Guild: " + guild.getName());

							customMessage = customMessage.replaceAll("@Users", Utilities.getBirthdays(BirthdayMessagesInGuild).toString());
							customMessage = customMessage.replaceAll("@users", Utilities.getBirthdays(BirthdayMessagesInGuild).toString());
							/////////////////Set custom birthday message
							if (useEmbed) {
								EmbedSender.sendEmbed(bChannel, null, customMessage, Color.decode("#1CFE86"));
							} else {
								try { //catch any unforeseen errors
									TextChannel finalBChannel = bChannel;
									bChannel.sendMessage(customMessage).queue(null, error -> {
										if (!(error instanceof PermissionException)) {
											Logger.Error("Failed to send message to a TextChannel with ID: " + finalBChannel.getId(), error);
										}
									});
								} catch (Exception ignored) {}
							}
							/////////////////
						}

					} catch (Exception ex) {
						Logger.Error("The Birthday Message Sender Caught an Exception.", ex);
					}

				}

			} catch (Exception ex) {
				Logger.Error("Birthday Tracker's Guild Loop Caught an Exception", ex);
			}

	}
}

