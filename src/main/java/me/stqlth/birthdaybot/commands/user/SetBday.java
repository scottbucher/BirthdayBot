package me.stqlth.birthdaybot.commands.user;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import com.jagrosh.jdautilities.commons.waiter.EventWaiter;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.Logger;
import me.stqlth.birthdaybot.utils.Utilities;
import me.stqlth.birthdaybot.utils.eHandler;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.Message;
import net.dv8tion.jda.api.entities.PrivateChannel;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.events.message.guild.GuildMessageReceivedEvent;
import net.dv8tion.jda.api.events.message.react.MessageReactionAddEvent;
import net.dv8tion.jda.api.exceptions.ErrorHandler;
import net.dv8tion.jda.api.exceptions.InsufficientPermissionException;
import net.dv8tion.jda.api.requests.ErrorResponse;
import org.apache.http.auth.AUTH;
import org.json.JSONArray;

import java.awt.*;
import java.sql.SQLException;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

public class NextSetBday extends Command {
	private BirthdayMessages birthdayMessages;
	private EventWaiter waiter;
	private DatabaseMethods db;
	private JSONArray regions;

	public NextSetBday(BirthdayMessages birthdayMessages, EventWaiter waiter, DatabaseMethods databaseMethods, BirthdayBotConfig birthdayBotConfig) {
		this.name = "newset";
		this.aliases = new String[]{"newadd"};
		this.guildOnly = false;
		this.help = "Sets a user's global birthday.";
		this.category = new Category("Utilities");

		this.birthdayMessages = birthdayMessages;
		this.waiter = waiter;
		this.db = databaseMethods;
		this.regions = birthdayBotConfig.getRegions();
	}

	@Override
	protected void execute(CommandEvent event) {
		boolean normal = !Utilities.isPrivate(event);

		User author = event.getAuthor();

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
			}, eHandler.PERMISSION);
		else
			event.getPrivateChannel().sendMessage(builder.build()).queue(result -> {
				waitForTimezone(event, result, author, false);
			}, eHandler.PERMISSION);

	}
	private void waitForTimezone(CommandEvent event, Message result, User author, boolean normal) {

		waiter.waitForEvent(MessageReceivedEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember())),
				e -> {
					List<String> acceptedZones = new ArrayList<>();
					for (String check : ZoneId.getAvailableZoneIds()) {
						for (Object region : regions) {
							if (check.startsWith(region.toString())) {
								acceptedZones.add(check);
								break;
							}
						}
					}

					boolean check = false;
					for (String acceptedZone : acceptedZones) {
						if (e.getMessage().getContentRaw().equalsIgnoreCase(acceptedZone)) {
							check = true;
							break;
						}
						}
					if (!check) {
						Logger.Info("FIRST");
						if (normal) birthdayMessages.invalidZone(event.getTextChannel()); else birthdayMessages.invalidZone(event.getPrivateChannel());
						return;
					}

					ZoneId zoneId;
					try {
						zoneId = ZoneId.of(e.getMessage().getContentRaw());
					} catch (DateTimeException ex) {
						Logger.Info("SECOND");
						if (normal) birthdayMessages.invalidZone(event.getTextChannel()); else birthdayMessages.invalidZone(event.getPrivateChannel());
						return;
					}
					getBirthDate(event, author, zoneId, normal);
				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, eHandler.PERMISSION);
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
			}, eHandler.PERMISSION);
		else
			event.getPrivateChannel().sendMessage(builder.build()).queue(result -> {
				waitForBirthDate(event, result, zoneid, false);
			}, eHandler.PERMISSION);

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
						if (normal) birthdayMessages.dateNotFound(event.getTextChannel()); else birthdayMessages.dateNotFound(event.getPrivateChannel());
						return;
					}

					String date =  getMonth(month) + " " + day + ", " + zoneId.toString();

					String sBday = year + "-" + month + "-" + day;

					if (!db.doesUserExist(event.getAuthor())) {
						db.addUser(event.getAuthor());
					}
					int changesLeft = db.getChangesLeft(event.getAuthor());
					if (changesLeft  <= 0){
						if (normal) birthdayMessages.outOfChanges(event.getTextChannel()); else birthdayMessages.outOfChanges(event.getPrivateChannel());
						return;
					} else changesLeft--;

					if (normal) sendConfirmation(event, date, sBday, zoneId.toString(), changesLeft, month, day, true);
					else  sendConfirmation(event, date, sBday, zoneId.toString(), changesLeft, month, day, false);

				}, 30, TimeUnit.SECONDS, () -> {
					result.delete().queue(null, eHandler.PERMISSION);
				});
	}

	public void sendConfirmation(CommandEvent event, String date, String sBday, String zoneId, int changesLeft, int month, int day, boolean normal) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Please confirm that this is the correct date: **" + date + "**");
		if (normal) event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			result.addReaction("\u2705").queue(null, eHandler.PERMISSION);
			result.addReaction("\u274C").queue(null, eHandler.PERMISSION);
			waitForConfirmation(event, result, sBday, zoneId, changesLeft, date, month, day, normal);
		}, eHandler.PERMISSION);
		else event.getPrivateChannel().sendMessage(builder.build()).queue(result -> {
			result.addReaction("\u2705").queue(null, eHandler.PERMISSION);
			result.addReaction("\u274C").queue(null, eHandler.PERMISSION);
			waitForConfirmation(event, result, sBday, zoneId, changesLeft, date, month, day, normal);
		}, eHandler.PERMISSION);
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
							msg.delete().queue(null, eHandler.PERMISSION);
							if (normal) birthdayMessages.success(event.getTextChannel(), date);
							else birthdayMessages.success(event.getPrivateChannel(), date);
						} catch (SQLException ex) {
							if (normal) birthdayMessages.invalidFormat(event.getTextChannel(), getName(), getArguments());
							else birthdayMessages.invalidFormat(event.getPrivateChannel(), getName(), getArguments());
							return;
						}
						db.updateChangesLeft(event, changesLeft);
						if (month == 2 && day == 29) leapDate(event, normal);
					} else if (e.getReactionEmote().getName().equals("\u274C")) msg.delete().queue(null, eHandler.PERMISSION);
				});
	}

	public void leapDate(CommandEvent event, boolean normal) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setTitle("**A Leap Day?!?!**")
				.setDescription("Wow! A birthday on a leap day? Only 1 in 1461 people are born on a leap day!" +
						"\n\nPlease note that on years that are __not__ a leap year, your birthday will be celebrated on February 28th.");
		if (normal) event.getTextChannel().sendMessage(builder.build()).queue(null, eHandler.PERMISSION);
		else event.getPrivateChannel().sendMessage(builder.build()).queue(null, eHandler.PERMISSION);
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
