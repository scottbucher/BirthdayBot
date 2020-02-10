package me.stqlth.birthdaybot.messages.discordOut;

import com.jagrosh.jdautilities.command.CommandEvent;
import com.jagrosh.jdautilities.commons.waiter.EventWaiter;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.getMethods.GetMessageInfo;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.events.message.react.MessageReactionAddEvent;

import java.awt.*;
import java.util.concurrent.TimeUnit;

public class BirthdayMessages {
	private BirthdayBotConfig birthdayBotConfig;
	private GetMessageInfo getMessageInfo;

	public BirthdayMessages(BirthdayBotConfig birthdayBotConfig, GetMessageInfo getMessageInfo) {
		this.birthdayBotConfig = birthdayBotConfig;
		this.getMessageInfo = getMessageInfo;
	}

	public void sendErrorMessage(TextChannel channel, CommandEvent event, String command, String args) {
		SelfUser bot = event.getJDA().getSelfUser();
		String botIcon = bot.getAvatarUrl();
		Guild g = event.getGuild();
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#EA2027"))
				.setDescription("You forgot some parameters, try using this format:" +
						"\nFormat: `bday " + command + " " + args + "`"
				+ "\nExample usage: `bday set 28, 8, 2001, -5`");
		channel.sendMessage(builder.build()).queue();
	}
	public void invalidFormat(TextChannel channel, CommandEvent event, String command, String args) {
		SelfUser bot = event.getJDA().getSelfUser();
		String botIcon = bot.getAvatarUrl();
		Guild g = event.getGuild();
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#EA2027"))
				.setDescription("Your date format was invalid, try using this format:" +
						"\nFormat: `bday " + command + " " + args + "`"
						+ "\nExample usage: `bday set 28, 8, 2001, -5`");
		channel.sendMessage(builder.build()).queue();
	}
	public void outOfChanges(CommandEvent event, TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("You have used already changed your birthday 3 times.");
		channel.sendMessage(builder.build()).queue();
	}
	public void tooYoung(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("You must be at least be 13 years old to use Discord. Review the Discord TOS [here](https://discordapp.com/terms).");
		channel.sendMessage(builder.build()).queue();
	}
	public void dateNotFound(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("That date doesn't exist. Review a calendar [here](https://www.timeanddate.com/calendar/).");
		channel.sendMessage(builder.build()).queue();
	}
	public void invalidOffset(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("Your GMT offset is invalid.\n\n" +
						"If you don't know what a GMT offset is, click [here](https://www.timeanddate.com/time/map/) and hover over your location on the map. " +
						"Your GMT offset is the value at the bottom that is highlighted " +
						"(if the highlighted value at the bottom simply says `UTC`, then your GMT offset is 0.).");
		channel.sendMessage(builder.build()).queue();
	}
	public void success(TextChannel channel, String date) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Successfully set your birthday to **" + date + "**!");
		channel.sendMessage(builder.build()).queue();
	}
}
