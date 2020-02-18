package me.stqlth.birthdaybot.commands.userCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.TextChannel;

import java.awt.*;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

public class Next extends Command {
	private BirthdayMessages birthdayMessages;
	private DatabaseMethods db;

	public Next(DatabaseMethods databaseMethods, BirthdayMessages birthdayMessages) {
		this.name = "next";
		this.aliases = new String[]{"upcoming"};
		this.guildOnly = true;
		this.help = "Shows the next birthday in this guild";
		this.arguments = "next";
		this.category = new Category("Utilities");

		this.db = databaseMethods;
		this.birthdayMessages = birthdayMessages;
	}

	@Override
	protected void execute(CommandEvent event) {
		TextChannel channel = event.getTextChannel();

			String[] args = event.getMessage().getContentRaw().split(" ");
			if (args.length > 2) return;

		List<Member> members = event.getGuild().getMembers();
		LocalDate now = LocalDate.now();

		LocalDate closest = now.plusYears(10);

		for (Member check : members) { //find the nearest birthday in the guild
			String checkDate = db.getUserBirthday(check.getUser());
			if (checkDate == null) continue;
			String[] values = checkDate.split("-");

			int day = Integer.parseInt(values[2]);
			int month = Integer.parseInt(values[1]);

			int currentYear = Calendar.getInstance().get(Calendar.YEAR);

			LocalDate birthDate = LocalDate.of(currentYear, month, day);


			if (now.isAfter(birthDate)) {
				birthDate = birthDate.plusYears(1);
			}

			if (birthDate.isBefore(closest) && !birthDate.equals(now)) closest = birthDate;
		}

		List<Member> birthdays = new ArrayList<>();

		for (Member check : members) { //Now with the nearest birthday, find which users have this birthday
			String checkDate = db.getUserBirthday(check.getUser());
			if (checkDate == null) continue;
			String[] values = checkDate.split("-");

			int day = Integer.parseInt(values[2]);
			int month = Integer.parseInt(values[1]);

			int currentYear = Calendar.getInstance().get(Calendar.YEAR);

			LocalDate birthDate = LocalDate.of(currentYear, month, day);

			if (now.isAfter(birthDate)) {
				birthDate = birthDate.plusYears(1);
			}

			if (birthDate.equals(closest)) birthdays.add(check);

		}

		if (birthdays.isEmpty()) {
			birthdayMessages.noBirthdays(channel, event.getGuild());
			return;
		}

		if (birthdays.size() > 1) {
			String birthday = db.getUserBirthday(birthdays.get(0).getUser());
			String[] values = birthday.split("-");
			int day = Integer.parseInt(values[2]);
			int month = Integer.parseInt(values[1]);

			int currentYear = Calendar.getInstance().get(Calendar.YEAR);
			LocalDate birthDay = LocalDate.of(currentYear, month, day);

			if (now.isAfter(birthDay)) {
				currentYear++;
			}

			int size = birthdays.size();
			StringBuilder bdays = new StringBuilder();

			if (size > 2) {
				for (int i = 0; i < size-1; i++)
					bdays.append(birthdays.get(i).getUser().getName()).append(", ");
				bdays.append("and ").append(birthdays.get(size-1).getUser().getName());
			} else {
				bdays.append(birthdays.get(0).getUser().getName()).append(" and ").append(birthdays.get(1).getUser().getName());
			}

			bdays.append("'s birthdays are on ");
			String date = "**" + getMonth(month) + " " + day + ", " + currentYear + "**";

			String message = bdays + date;

			EmbedBuilder builder = new EmbedBuilder();
			builder.setColor(Color.decode("#1CFE86"))
					.setDescription("The next birthdays are " + message);
			channel.sendMessage(builder.build()).queue();

			return;
		} else {
			String birthday = db.getUserBirthday(birthdays.get(0).getUser());
			String[] values = birthday.split("-");

			int day = Integer.parseInt(values[2]);
			int month = Integer.parseInt(values[1]);

			int currentYear = Calendar.getInstance().get(Calendar.YEAR);
			LocalDate birthDay = LocalDate.of(currentYear, month, day);

			if (now.isAfter(birthDay)) {
				currentYear++;
			}

			String date = getMonth(month) + " " + day + ", " + currentYear;
			birthdayMessages.nextBirthday(channel, date, birthdays.get(0));
			return;
		}



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
