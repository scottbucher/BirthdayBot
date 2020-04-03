package me.stqlth.birthdaybot.messages.discordOut;

import me.stqlth.birthdaybot.utils.ErrorManager;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.exceptions.InsufficientPermissionException;

import java.awt.*;
import java.util.List;

public class BirthdayMessages {

	public static void sendErrorMessage(TextChannel channel, String command, String args) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("We recommend using this command in BirthdayBot's PM's for privacy." +
						"\n\nYou forgot some parameters, try using this format:" +
						"\nFormat: `bday " + command + " " + args + "`"
						+ "\nExample usage: `bday set 28, 8, 2001, America/New_York`");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}
	public static void sendErrorMessage(PrivateChannel channel, String command, String args) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("You forgot some parameters, try using this format:" +
						"\nFormat: `bday " + command + " " + args + "`"
						+ "\nExample usage: `bday set 28, 8, 2001, America/New_York`");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
	}

	public static void invalidFormat(TextChannel channel, String command, String args) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("Your date format was invalid, try using this format:" +
						"\nFormat: `bday " + command + " " + args + "`"
						+ "\nExample usage: `bday set 28, 8, 2001, America/New_York`");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}

	public static void invalidFormat(PrivateChannel channel, String command, String args) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("Your date format was invalid, try using this format:" +
						"\nFormat: `bday " + command + " " + args + "`"
						+ "\nExample usage: `bday set 28, 8, 2001, America/New_York`");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
	}
	public static void noUser(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("I can't find that user!");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}

	public static void outOfChanges(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("You have used already changed your birthday 3 times.");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}

	public static void outOfChanges(PrivateChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("You have used already changed your birthday 3 times.");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
	}

	public static void dateNotFound(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("That date doesn't exist. Review a calendar [here](https://www.timeanddate.com/calendar/).");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}

	public static void dateNotFound(PrivateChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("That date doesn't exist. Review a calendar [here](https://www.timeanddate.com/calendar/).");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
	}

	public static void noBirthdays(TextChannel channel, Guild guild) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("There are no upcoming birthdays in **" + guild.getName() + "**!\nSet your birthday with `bday set`!");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}

	public static void noBirthday(TextChannel channel, Member member) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("**" + member.getUser().getName() + "** does not have a birthday set! :(");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}

	public static void invalidZone(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("Your ZoneId is invalid.\n\n" +
						"If you don't know what a ZoneId is, click [here](http://kevalbhatt.github.io/timezone-picker/) and hover over your location on the map. " +
						"Your ZoneId is the Location that appears at the bottom of the map. " +
						"\n(Do __**not**__ use the shortened values of the Zones. Example: `EST`).");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}

	public static void invalidZone(PrivateChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("Your ZoneId is invalid.\n\n" +
						"If you don't know what a ZoneId is, click [here](http://kevalbhatt.github.io/timezone-picker/) and hover over your location on the map. " +
						"Your ZoneId is the Location that appears at the bottom of the map. " +
						"\n(Do __**not**__ use the shortened values of the Zones. Example: `EST`).");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
	}

	public static void success(TextChannel channel, String date) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Successfully set your birthday to **" + date + "**!");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}

	public static void success(PrivateChannel channel, String date) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Successfully set your birthday to **" + date + "**!");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
	}

	public static void userBirthday(TextChannel channel, String date, Member member) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription(member.getUser().getName() + "'s birthday is on **" + date + "**.");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}

	public static void nextBirthday(TextChannel channel, String date, User member) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("**" + member.getName() + "'s** birthday is next on **" + date + "**!");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}

	public static void inviteBot(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Invite BirthdayBot to your server [here](https://discordapp.com/api/oauth2/authorize?client_id=656621136808902656&permissions=269053008&scope=bot)!");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}

	public static void inviteBot(PrivateChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Invite BirthdayBot to your server [here](https://discordapp.com/api/oauth2/authorize?client_id=656621136808902656&permissions=269053008&scope=bot)!");
		try {
			channel.sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
		} catch (InsufficientPermissionException ignored) {
		}
	}

	public static void joinSupportServer(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("For support join our discord server [here](https://discord.gg/24xS3N5)!");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}

	public static void joinSupportServer(PrivateChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("For support join our discord server [here](https://discord.gg/24xS3N5)!");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
	}

	public static void happyBirthday(TextChannel channel, Member member) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Happy Birthday " + member.getAsMention() + "!");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}

	public static void happyBirthdays(TextChannel channel, List<Member> birthdays) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Happy Birthday to " + getBirthdays(birthdays) + "!");
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}

	public static void customBirthdayMessage(TextChannel channel, List<Member> birthdays, String message) {
		EmbedBuilder builder = new EmbedBuilder();

		String bdays = getBirthdays(birthdays).toString();
		message = message.replaceAll("@Users", bdays);

		builder.setColor(Color.decode("#1CFE86"))
				.setDescription(message);
		channel.sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
	}

	public static StringBuilder getBirthdays(List<Member> birthdays) {
		int size = birthdays.size();
		StringBuilder bdays = new StringBuilder();

		if (size > 2) {
			for (int i = 0; i < size - 1; i++)
				bdays.append(birthdays.get(i).getAsMention()).append(", ");

			bdays.append("and ").append(birthdays.get(size - 1).getUser().getAsMention());
		} else if (size == 2) {
			bdays.append(birthdays.get(0).getAsMention()).append(" and ").append(birthdays.get(1).getAsMention());
		} else {
			bdays.append(birthdays.get(0).getAsMention());
		}
		return bdays;
	}
}
