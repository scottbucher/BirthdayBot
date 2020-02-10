package me.stqlth.birthdaybot.commands.userCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.SelfUser;
import net.dv8tion.jda.api.entities.TextChannel;

import java.awt.*;

public class Help extends Command {

	public Help() {
		this.name = "help";
	}

	@Override
	protected void execute(CommandEvent event) {
		sendHelpMessage(event, event.getTextChannel());
	}

	public void sendHelpMessage(CommandEvent event, TextChannel channel) {
		SelfUser bot = event.getJDA().getSelfUser();
		String botIcon = bot.getAvatarUrl();
		Guild g = event.getGuild();
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor("BirthdayBot", bot.getAvatarUrl())
				.addField("bday set <day>, <month>, <year>, <gmt offset>", "This command enters your birthday into our system. " +
						"Each User may use this command up to __**3**__ times. This is to prevent abuse.\n\n" +
						"If you don't know what a GMT offset is, click [here](https://www.timeanddate.com/time/map/) and hover over your location on the map. " +
						"Your GMT offset is the value at the bottom that is highlighted " +
						"(if the highlighted value at the bottom simply says `UTC`, then your GMT offset is 0.).\n\n" +
						"Example usage: `bday set 28, 8, 2001, -5`", false);
		channel.sendMessage(builder.build()).queue();
	}
}
