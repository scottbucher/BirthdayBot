package me.stqlth.birthdaybot.commands.user;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import com.jagrosh.jdautilities.commons.waiter.EventWaiter;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.utils.*;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Message;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.events.message.react.MessageReactionAddEvent;
import net.dv8tion.jda.api.exceptions.PermissionException;
import org.jetbrains.annotations.Nls;
import org.json.JSONArray;

import javax.security.auth.Subject;
import java.awt.*;
import java.sql.SQLException;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

public class SetBday extends Command {
	private EventWaiter waiter;
	private DatabaseMethods db;
	private JSONArray regions;

	public SetBday(EventWaiter waiter, DatabaseMethods databaseMethods) {
		this.name = "set";
		this.aliases = new String[]{"add"};
		this.guildOnly = false;
		this.help = "Sets a user's global birthday.";
		this.category = new Category("Utilities");
		this.botPermissions = new Permission[]{Permission.MESSAGE_WRITE, Permission.MESSAGE_ADD_REACTION, Permission.MESSAGE_EMBED_LINKS, Permission.MESSAGE_MANAGE};

		this.waiter = waiter;
		this.db = databaseMethods;
		this.regions = BirthdayBotConfig.getRegions();
	}

	@Override
	protected void execute(CommandEvent event) {
		boolean normal = !Utilities.isPrivate(event);

		User author = event.getAuthor();

		if (db.doesUserExist(author)) {
			if (db.getChangesLeft(author)<= 0) {
				String message = "You have already set your birthday 5 times.";
				if (normal) EmbedSender.sendEmbed(event.getTextChannel(), null, message, Color.RED);
				else EmbedSender.sendEmbed(event.getPrivateChannel(), null, message, Color.RED);
				return;
			}
		}


		getTimezone(event, author, normal);


	}

	public void getTimezone(CommandEvent event, User author, boolean normal) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getName() + "#" + author.getDiscriminator(), null, author.getAvatarUrl())
				.setTitle("**User Setup - Timezone Selection**")
				.setDescription("\uD83D\uDEA8 **Notice** \uD83D\uDEA8" +
						"\nBy submitting your birthday you consent that this information can be publicly shown to anyone." +
						"\n" +
						"\n » To begin your setup you must select your timezone. This allows the bot to know what time to trigger your birthday!" +
						"\n" +
						"\nTo find your timezone please use the map [here](http://kevalbhatt.github.io/timezone-picker/)." +
						"\n" +
						"\n**Example Usage**: `America/New_York`")
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		if (normal)
			event.getTextChannel().sendMessage(builder.build()).queue(result -> {
				waitForTimezone(event, result, author, true);
			}, ErrorManager.GENERAL);
		else
			event.getPrivateChannel().sendMessage(builder.build()).queue(result -> {
				waitForTimezone(event, result, author, false);
			}, ErrorManager.GENERAL);

	}

	private void waitForTimezone(CommandEvent event, Message result, User author, boolean normal) {

		waiter.waitForEvent(MessageReceivedEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember())),
				e -> {
					String input = e.getMessage().getContentRaw();
					List<String> acceptedZones = new ArrayList<>();
					for (String check : ZoneId.getAvailableZoneIds()) {
						for (Object region : regions) {
							if (check.startsWith(region.toString())) {
								acceptedZones.add(check);
								break;
							}
						}
					}

					ZoneId zoneId = null;
					final String message = "Your ZoneId is invalid.\n\n" +
							"If you don't know what a ZoneId is, click [here](http://kevalbhatt.github.io/timezone-picker/) and hover over your location on the map. " +
							"Your ZoneId is the Location that appears at the bottom of the map. " +
							"\n(Do __**not**__ use the shortened values of the Zones. Example: `EST`).";

					input = input.replace(' ', '_').toLowerCase();
					for (String acceptedZone : acceptedZones)
						if (acceptedZone.toLowerCase().contains(input))
							zoneId = ZoneId.of(acceptedZone);


					if (zoneId == null) {
						if (normal) EmbedSender.sendEmbed(event.getTextChannel(), null, message, Color.RED);
						else EmbedSender.sendEmbed(event.getPrivateChannel(), null, message, Color.RED);
						return;
					}


					getBirthDate(event, author, zoneId, normal);
				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.GENERAL);
				});
	}

	public void getBirthDate(CommandEvent event, User author, ZoneId zoneid, boolean normal) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getName() + "#" + author.getDiscriminator(), null, author.getAvatarUrl())
				.setTitle("**User Setup - Birth Date**")
				.setDescription(
						"\n » Now you will have to provide <@656621136808902656> with your birth month and day." +
								"\n" +
								"\n**Example Usage**: `08/28` (MM/DD)")
				.setFooter("This message will timeout in 30 seconds!", event.getJDA().getSelfUser().getAvatarUrl());

		if (normal)
			event.getTextChannel().sendMessage(builder.build()).queue(result -> {
				waitForBirthDate(event, result, zoneid, true);
			}, ErrorManager.GENERAL);
		else
			event.getPrivateChannel().sendMessage(builder.build()).queue(result -> {
				waitForBirthDate(event, result, zoneid, false);
			}, ErrorManager.GENERAL);

	}

	private void waitForBirthDate(CommandEvent event, Message result, ZoneId zoneId, boolean normal) {

		waiter.waitForEvent(MessageReceivedEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember())),
				e -> {
					String[] args = e.getMessage().getContentRaw().split("/");

					int day;
					int month;
					int year = 2000;

					try { //try catch to check for invalid dates such as February 30th
						day = Integer.parseInt(args[1]);
						month = Integer.parseInt(args[0]);
						LocalDate birthDate = LocalDate.of(year, month, day);
					} catch (Exception ex) {
						String message = "That date doesn't exist. Review a calendar [here](https://www.timeanddate.com/calendar/).";
						if (normal) EmbedSender.sendEmbed(event.getTextChannel(), null, message, Color.RED);
						else EmbedSender.sendEmbed(event.getPrivateChannel(), null, message, Color.RED);
						return;
					}

					String date = getMonth(month) + " " + day + ", " + zoneId.toString();

					String sBday = year + "-" + month + "-" + day;

					if (!db.doesUserExist(event.getAuthor())) {
						db.addUser(event.getAuthor());
					}
					int changesLeft = db.getChangesLeft(event.getAuthor());
					changesLeft--;

					if (normal) sendConfirmation(event, date, sBday, zoneId.toString(), changesLeft, month, day, true);
					else sendConfirmation(event, date, sBday, zoneId.toString(), changesLeft, month, day, false);

				}, 30, TimeUnit.SECONDS, () -> {
					result.delete().queue(null, ErrorManager.GENERAL);
				});
	}

	public void sendConfirmation(CommandEvent event, String date, String sBday, String zoneId, int changesLeft, int month, int day, boolean normal) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Please confirm this information is correct: **" + date + "**")
				.setFooter("You have " + db.getChangesLeft(event.getAuthor()) + " birthday set(s) left. By clicking confirm you will use one of them.", event.getSelfUser().getAvatarUrl());
		if (normal) event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			result.addReaction("\u2705").queue(null, ErrorManager.GENERAL);
			result.addReaction("\u274C").queue(null, ErrorManager.GENERAL);
			waitForConfirmation(event, result, sBday, zoneId, changesLeft, date, month, day, normal);
		}, ErrorManager.GENERAL);
		else event.getPrivateChannel().sendMessage(builder.build()).queue(result -> {
			result.addReaction("\u2705").queue(null, ErrorManager.PRIVATE);
			result.addReaction("\u274C").queue(null, ErrorManager.PRIVATE);
			waitForConfirmation(event, result, sBday, zoneId, changesLeft, date, month, day, normal);
		}, ErrorManager.GENERAL);
	}

	private void waitForConfirmation(CommandEvent event, Message msg, String sBday, String zoneId, int changesLeft, String date, int month, int day, boolean normal) {

		waiter.waitForEvent(MessageReactionAddEvent.class,
				e -> e.getChannel().equals(event.getChannel()) && !Objects.requireNonNull(e.getUser()).isBot() &&
						((e.getReactionEmote().getName().equals("\u2705") || e.getReactionEmote().getName().equals("\u274C")) && Objects.equals(e.getMember(), event.getMember())),
				e -> {
					if (e.getReactionEmote().getName().equals("\u2705")) {
						try {
							db.updateBirthday(event.getAuthor(), sBday);
							db.updateZoneId(event, zoneId);
							msg.delete().queue(null, ErrorManager.GENERAL);
							if (normal)
								EmbedSender.sendEmbed(event.getTextChannel(), null, "Successfully set your birthday to **" + date + "**!", Color.decode("#1CFE86"));
							else
								EmbedSender.sendEmbed(event.getPrivateChannel(), null, "Successfully set your birthday to **" + date + "**!", Color.decode("#1CFE86"));
						} catch (SQLException ex) {
							if (normal)
								EmbedSender.sendEmbed(event.getTextChannel(), null, "Invalid Format.\nExample Date: `08/28`", Color.RED);
							else
								EmbedSender.sendEmbed(event.getPrivateChannel(), null, "Invalid Format.\nExample Date: `08/28`", Color.RED);
							return;
						}
						db.updateChangesLeft(event.getAuthor(), changesLeft);
						if (month == 2 && day == 29) leapDate(event, normal);
					} else if (e.getReactionEmote().getName().equals("\u274C")) {
						msg.delete().queue(null, ErrorManager.GENERAL);
						if (normal) {
							EmbedSender.sendEmbed(event.getTextChannel(), null, "Your birthday has not been set.", Color.RED);
						} else EmbedSender.sendEmbed(event.getPrivateChannel(), null, "Your birthday has not been set.", Color.RED);
					}
				});
	}

	public void leapDate(CommandEvent event, boolean normal) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setTitle("**A Leap Day?!?!**")
				.setDescription("Wow! A birthday on a leap day? Only 1 in 1461 people are born on a leap day!" +
						"\n\nPlease note that on years that are __not__ a leap year, your birthday will be celebrated on February 28th.");
		if (normal) event.getTextChannel().sendMessage(builder.build()).queue(null, ErrorManager.GENERAL);
		else event.getPrivateChannel().sendMessage(builder.build()).queue(null, ErrorManager.GENERAL);
	}

	private static String getMonth(int month) {
		switch (month) {
			case 1:
				return "January";
			case 2:
				return "February";
			case 3:
				return "March";
			case 4:
				return "April";
			case 5:
				return "May";
			case 6:
				return "June";
			case 7:
				return "July";
			case 8:
				return "August";
			case 9:
				return "September";
			case 10:
				return "October";
			case 11:
				return "November";
			case 12:
				return "December";
			default:
				return "Invalid month";
		}
	}
}
