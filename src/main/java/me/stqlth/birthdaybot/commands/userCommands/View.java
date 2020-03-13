package me.stqlth.birthdaybot.commands.userCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.TextChannel;

import java.time.LocalDate;
import java.time.Period;

public class View extends Command {

	private DatabaseMethods db;
	private BirthdayMessages birthdayMessages;

	public View(DatabaseMethods databaseMethods, BirthdayMessages birthdayMessages) {
		this.name = "view";
		this.aliases = new String[]{"show"};
		this.help = "View another user's birthday";
		this.guildOnly = true;
		this.arguments = "<name>";
		this.category = new Category("Utilities");

		this.db = databaseMethods;
		this.birthdayMessages = birthdayMessages;
	}

	@Override
	protected void execute(CommandEvent event) {
		TextChannel channel = event.getTextChannel();

		String[] args = event.getMessage().getContentRaw().split(" ");
		if (args.length != 3) return;

		Member target;

		try {
			target = event.getMessage().getMentionedMembers().get(0);
		} catch (Exception ignored) {
			target = event.getGuild().getMembers().stream().filter(member -> member.getEffectiveName().toLowerCase().contains(args[2].toLowerCase())).findFirst().orElse(null);
			if (target == null)
				target = event.getGuild().getMembers().stream().filter(member -> member.getUser().getName().toLowerCase().contains(args[2].toLowerCase())).findFirst().orElse(null);
		}

		if (target == null) {
			birthdayMessages.noUser(channel);
			return;
		}

		if (!db.doesUserExist(target.getUser()) || db.getUserBirthday(target.getUser()) == null) {
			birthdayMessages.noBirthday(channel, target);
			return;
		}

		String birthday = db.getUserBirthday(target.getUser()); //we set birthday here so we don't try to get a user's birthday who isn't in the database in the block above
		String[] values = birthday.split("-");
		String utcTime = String.valueOf(db.getUserUTCTime(target.getUser()));

		int day = Integer.parseInt(values[2]);
		int month = Integer.parseInt(values[1]);
		int year = Integer.parseInt(values[0]);

		if (utcTime.equals("0")) {
			utcTime = "UTC";
		} else if (12 <= Integer.parseInt(utcTime) && Integer.parseInt(utcTime) <= 23){
			day++;
			utcTime = "GMT" + (24-Integer.parseInt(utcTime));
		} else utcTime = "GMT-" + utcTime;

		LocalDate birthDate = LocalDate.of(year, month, day);
		int age = calculateAge(birthDate, LocalDate.now());

		if (db.getPreventAge(event.getGuild()) || db.getHideAge(target.getUser())) {
			String date = getMonth(month) + " " + day + ", " + utcTime;
			birthdayMessages.userBirthdayNoAge(channel, date, target);
			return;
		}

		String date = getMonth(month) + " " + day + ", " + year + " " + utcTime;
		birthdayMessages.userBirthdayWithAge(channel, date, target, age);
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