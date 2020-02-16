package me.stqlth.birthdaybot.events;

import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.messages.discordOut.StaffMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.events.message.guild.GuildMessageReceivedEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;

import javax.annotation.Nonnull;
import java.time.LocalDate;
import java.time.Period;

public class GuildMessageRecieved extends ListenerAdapter {

	private DatabaseMethods db;
	private BirthdayMessages birthdayMessages;

	public GuildMessageRecieved(DatabaseMethods databaseMethods, BirthdayMessages birthdayMessages) {
		this.db = databaseMethods;
		this.birthdayMessages = birthdayMessages;
	}

	@Override
	public void onGuildMessageReceived(@Nonnull GuildMessageReceivedEvent event) {
		TextChannel channel = event.getChannel();

		String[] args = event.getMessage().getContentRaw().split(" ");

		if (args.length != 2) return;

		if (!args[0].equals("bday")) return;

		Member target;

		target = event.getGuild().getMembers().stream().filter(member -> member.getEffectiveName().toLowerCase().contains(args[1].toLowerCase())).findFirst().orElse(null);
		if (target == null)target = event.getGuild().getMembers().stream().filter(member -> member.getUser().getName().toLowerCase().contains(args[1].toLowerCase())).findFirst().orElse(null);

		if (target == null) {
			birthdayMessages.noUser(channel);
			return;
		}

		String birthday = db.getUserBirthday(target);
		if (birthday == null) {
			birthdayMessages.noBirthday(channel, target);
			return;
		}
		String[] values = birthday.split("-");
		String offset = String.valueOf(db.getUserOffset(target));
		if (offset.equals("0")) {
			offset = "UTC";
		} else offset = "GMT" + offset;
		int day = Integer.parseInt(values[2]);
		int month = Integer.parseInt(values[1]);
		int year = Integer.parseInt(values[0]);

		String date = getMonth(month) + " " + day + ", " + year + " " + offset;

		LocalDate birthDate = LocalDate.of(year, month, day);
		int age = calculateAge(birthDate, LocalDate.now());

		birthdayMessages.userBirthday(channel, date, target, age);
	}
	private static int calculateAge(LocalDate birthDate, LocalDate currentDate) {
		if ((birthDate != null) && (currentDate != null)) {
			return Period.between(birthDate, currentDate).getYears();
		} else {
			return 0;
		}
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
