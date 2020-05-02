package me.stqlth.birthdaybot.commands.user;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.EmbedSender;
import me.stqlth.birthdaybot.utils.Utilities;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.entities.User;

import java.awt.*;
import java.time.LocalDate;
import java.util.Calendar;
import java.util.List;

public class Next extends Command {
	private DatabaseMethods db;

	public Next(DatabaseMethods databaseMethods) {
		this.name = "next";
		this.aliases = new String[]{"upcoming"};
		this.guildOnly = true;
		this.help = "Shows the next birthday in this guild";
		this.arguments = "next";
		this.category = new Category("Utilities");
		this.botPermissions = new Permission[]{Permission.MESSAGE_WRITE};

		this.db = databaseMethods;
	}

	@Override
	protected void execute(CommandEvent event) {
		Guild guild = event.getGuild();
		StringBuilder members = new StringBuilder();
		TextChannel channel = event.getTextChannel();
		LocalDate now = LocalDate.now();

		for (Member member : guild.getMembers()) {
			if (member.getUser().isBot()) continue;
			members.append(member.getId()).append(",");
		}
		members.delete(members.length()-1, members.length()); //remove the last comma

		List<User> bdays = db.getNextBirthdays(event, members.toString());

		if (bdays == null || bdays.isEmpty()) {
			EmbedSender.sendEmbed(event.getTextChannel(), null, "There are no upcoming birthdays in **" + guild.getName() + "**!\nSet your birthday with `bday set`!", Color.RED);
			return;
		}

		for (User check : bdays) {
			List<Guild> checkGuilds = event.getJDA().getMutualGuilds(check);
			if (!checkGuilds.contains(event.getGuild())) bdays.remove(check);
		}

		if (bdays.size() > 1) {
			String birthday = db.getUserBirthday(bdays.get(0));
			String[] values = birthday.split("-");
			int day = Integer.parseInt(values[2]);
			int month = Integer.parseInt(values[1]);
			int currentYear = Calendar.getInstance().get(Calendar.YEAR);

			if (now.isAfter(LocalDate.of(currentYear, month, day))) currentYear++;
			if (day == 29 && month == 2 && !Utilities.isLeap(currentYear)) {
				day--;
			}

			int size = bdays.size();
			StringBuilder bString = new StringBuilder();

			if (size > 2) {
				for (int i = 0; i < size-1; i++)
					bString.append(bdays.get(i).getName()).append(", ");
				bString.append("and ").append(bdays.get(size-1).getName());
			} else {
				bString.append(bdays.get(0).getName()).append(" and ").append(bdays.get(1).getName());
			}

			bString.append("'s birthdays on ");
			String date = "**" + getMonth(month) + " " + day + ", " + currentYear + "**";

			String message = bString + date;

			EmbedSender.sendEmbed(event.getTextChannel(), null, "The next birthdays are " + message, Color.decode("#1CFE86"));
		} else {
			String birthday = db.getUserBirthday(bdays.get(0));
			String[] values = birthday.split("-");

			int day = Integer.parseInt(values[2]);
			int month = Integer.parseInt(values[1]);
			int currentYear = Calendar.getInstance().get(Calendar.YEAR);

			if (now.isAfter(LocalDate.of(currentYear, month, day))) currentYear++;
			if (day == 29 && month == 2 && !Utilities.isLeap(currentYear)) {
				day--;
			}

			String date = getMonth(month) + " " + day + ", " + currentYear;
			EmbedSender.sendEmbed(event.getTextChannel(), null, "**" + bdays.get(0).getName() + "'s** birthday is next on **" + date + "**!", Color.decode("#1CFE86"));
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
