package me.stqlth.birthdaybot.messages.discordOut;

import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.getMethods.GetMessageInfo;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.Logger;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.*;

import java.awt.*;
import java.util.List;

public class BirthdayMessages {

	private DatabaseMethods db;

	public BirthdayMessages(DatabaseMethods databaseMethods) {
		this.db = databaseMethods;
	}

	public void sendErrorMessage(TextChannel channel, CommandEvent event, String command, String args) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("You forgot some parameters, try using this format:" +
						"\nFormat: `bday " + command + " " + args + "`"
				+ "\nExample usage: `bday set 28, 8, 2001, -5`");
		channel.sendMessage(builder.build()).queue();
	}
	public void invalidFormat(TextChannel channel, CommandEvent event, String command, String args) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("Your date format was invalid, try using this format:" +
						"\nFormat: `bday " + command + " " + args + "`"
						+ "\nExample usage: `bday set 28, 8, 2001, -5`");
		channel.sendMessage(builder.build()).queue();
	}
	public void noUser(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("I can't find that user!");
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
	public void noBirthdays(TextChannel channel, Guild guild) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("There are no upcoming birthdays in **" + guild.getName() + "**!\nSet your birthday with `bday set`!");
		channel.sendMessage(builder.build()).queue();
	}
	public void noBirthday(TextChannel channel, Member member) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("**" + member.getUser().getName() + "** does not have a birthday set! :(");
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
	public void userBirthday(TextChannel channel, String date,  Member member, int age) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription(member.getUser().getName() + "'s birthday is on **" + date + "**.\nThey are **" + age + "** years old." );
		channel.sendMessage(builder.build()).queue();
	}
	public void nextBirthday(TextChannel channel, String date, Member member) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("**" + member.getUser().getName() + "'s** birthday is next on **" + date + "**!");
		channel.sendMessage(builder.build()).queue();
	}
	public void inviteBot(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Invite BirthdayBot to your server [here](https://discordapp.com/oauth2/authorize?client_id=656621136808902656&permissions=8&scope=bot)!");
		channel.sendMessage(builder.build()).queue();
	}
	public void joinSupportServer(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("For support join our discord server [here](https://discord.gg/CJnWuWn)!");
		channel.sendMessage(builder.build()).queue();
	}
	public void happyBirthday(TextChannel channel, Member member) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Happy Birthday " + member.getAsMention() + "!");
		channel.sendMessage(builder.build()).queue();
	}
	public void happyBirthdays(TextChannel channel, List<Member> birthdays) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Happy Birthday to " + getBirthdays(birthdays) + "!");
		channel.sendMessage(builder.build()).queue();
	}
	public void customBirthdayMessage(TextChannel channel, List<Member> birthdays, String message) {
		EmbedBuilder builder = new EmbedBuilder();

		String bdays = getBirthdays(birthdays).toString();
		message = message.replaceAll("@Users", bdays);

		builder.setColor(Color.decode("#1CFE86"))
				.setDescription(message);
		channel.sendMessage(builder.build()).queue();
	}

	public StringBuilder getBirthdays(List<Member> birthdays) {
		int size = birthdays.size();
		StringBuilder bdays = new StringBuilder();

		if (size > 2) {
			for (int i = 0; i < size-1; i++)
				bdays.append(birthdays.get(i).getAsMention()).append(", ");

			bdays.append("and ").append(birthdays.get(size-1).getUser().getAsMention());
		} else if (size == 2){
			bdays.append(birthdays.get(0).getAsMention()).append(" and ").append(birthdays.get(1).getAsMention());
		} else {
			bdays.append(birthdays.get(0).getAsMention());
		}
		return bdays;
	}
}
