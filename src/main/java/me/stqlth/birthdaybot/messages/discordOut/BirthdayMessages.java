package me.stqlth.birthdaybot.messages.discordOut;

import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.exceptions.InsufficientPermissionException;

import java.awt.*;
import java.util.List;

public class BirthdayMessages {

	public void sendErrorMessage(TextChannel channel, String command, String args) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("We recommend using this command in BirthdayBot's PM's for privacy." +
						"\n\nYou forgot some parameters, try using this format:" +
						"\nFormat: `bday " + command + " " + args + "`"
				+ "\nExample usage: `bday set 28, 8, 2001, -5`");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void sendErrorMessage(PrivateChannel channel, String command, String args) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("You forgot some parameters, try using this format:" +
						"\nFormat: `bday " + command + " " + args + "`"
						+ "\nExample usage: `bday set 28, 8, 2001, -5`");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void invalidFormat(TextChannel channel, String command, String args) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("Your date format was invalid, try using this format:" +
						"\nFormat: `bday " + command + " " + args + "`"
						+ "\nExample usage: `bday set 28, 8, 2001, -5`");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void invalidFormat(PrivateChannel channel, String command, String args) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("Your date format was invalid, try using this format:" +
						"\nFormat: `bday " + command + " " + args + "`"
						+ "\nExample usage: `bday set 28, 8, 2001, -5`");
			try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void invalidSetFormat(TextChannel channel, String command, String args) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("Invalid Format!" +
						"\nFormat: `bday " + command + " " + args + "`"
						+ "\nExample usage: `bday HideAge true`");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void invalidSetFormat(PrivateChannel channel, String command, String args) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("Invalid Format!" +
						"\nFormat: `bday " + command + " " + args + "`"
						+ "\nExample usage: `bday HideAge true`");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void noUser(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("I can't find that user!");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void outOfChanges(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("You have used already changed your birthday 3 times.");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void outOfChanges(PrivateChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("You have used already changed your birthday 3 times.");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void tooYoung(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("You must be at least be 13 years old to use Discord. Review the Discord TOS [here](https://discordapp.com/terms).");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void tooYoung(PrivateChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("You must be at least be 13 years old to use Discord. Review the Discord TOS [here](https://discordapp.com/terms).");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void dateNotFound(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("That date doesn't exist. Review a calendar [here](https://www.timeanddate.com/calendar/).");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void dateNotFound(PrivateChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("That date doesn't exist. Review a calendar [here](https://www.timeanddate.com/calendar/).");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void noBirthdays(TextChannel channel, Guild guild) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("There are no upcoming birthdays in **" + guild.getName() + "**!\nSet your birthday with `bday set`!");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void noBirthday(TextChannel channel, Member member) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("**" + member.getUser().getName() + "** does not have a birthday set! :(");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void invalidOffset(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("Your GMT offset is invalid.\n\n" +
						"If you don't know what a GMT offset is, click [here](https://www.timeanddate.com/time/map/) and hover over your location on the map. " +
						"Your GMT offset is the value at the bottom that is highlighted " +
						"(if the highlighted value at the bottom simply says `UTC`, then your GMT offset is 0.).");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void invalidOffset(PrivateChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#EA2027"))
				.setDescription("Your GMT offset is invalid.\n\n" +
						"If you don't know what a GMT offset is, click [here](https://www.timeanddate.com/time/map/) and hover over your location on the map. " +
						"Your GMT offset is the value at the bottom that is highlighted " +
						"(if the highlighted value at the bottom simply says `UTC`, then your GMT offset is 0.).");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void success(TextChannel channel, String date) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Successfully set your birthday to **" + date + "**!");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void success(PrivateChannel channel, String date) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Successfully set your birthday to **" + date + "**!");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void userBirthdayWithAge(TextChannel channel, String date,  Member member, int age) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription(member.getUser().getName() + "'s birthday is on **" + date + "**.\nThey are **" + age + "** years old." );
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void userBirthdayNoAge(TextChannel channel, String date,  Member member) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription(member.getUser().getName() + "'s birthday is on **" + date + "**." );
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void nextBirthday(TextChannel channel, String date, Member member) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("**" + member.getUser().getName() + "'s** birthday is next on **" + date + "**!");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void inviteBot(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Invite BirthdayBot to your server [here](https://discordapp.com/api/oauth2/authorize?client_id=656621136808902656&permissions=269053008&scope=bot)!");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void inviteBot(PrivateChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Invite BirthdayBot to your server [here](https://discordapp.com/api/oauth2/authorize?client_id=656621136808902656&permissions=269053008&scope=bot)!");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void joinSupportServer(TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("For support join our discord server [here](https://discord.gg/CJnWuWn)!");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void joinSupportServer(PrivateChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("For support join our discord server [here](https://discord.gg/CJnWuWn)!");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void happyBirthday(TextChannel channel, Member member) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Happy Birthday " + member.getAsMention() + "!");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void happyBirthdays(TextChannel channel, List<Member> birthdays) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setDescription("Happy Birthday to " + getBirthdays(birthdays) + "!");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void customBirthdayMessage(TextChannel channel, List<Member> birthdays, String message) {
		EmbedBuilder builder = new EmbedBuilder();

		String bdays = getBirthdays(birthdays).toString();
		message = message.replaceAll("@Users", bdays);

		builder.setColor(Color.decode("#1CFE86"))
				.setDescription(message);
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void setHideAge(TextChannel channel, boolean setting) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"));
		if (setting) builder.setDescription("**BirthdayBot** will no longer display your age in __any__ discord!");
		else builder.setDescription("**BirthdayBot** will now display your age. Use with caution.");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
	}
	public void setHideAge(PrivateChannel channel, boolean setting) {
		EmbedBuilder builder = new EmbedBuilder();
		builder.setColor(Color.decode("#1CFE86"));
		if (setting) builder.setDescription("**BirthdayBot** will no longer display your age in __any__ discord!");
		else builder.setDescription("**BirthdayBot** will now display your age. Use with caution.");
		try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
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
