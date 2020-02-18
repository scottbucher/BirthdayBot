package me.stqlth.birthdaybot.commands.userCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.entities.TextChannel;

public class HideAge extends Command {
	private BirthdayMessages birthdayMessages;
	private DatabaseMethods db;

	public HideAge(DatabaseMethods databaseMethods, BirthdayMessages birthdayMessages) {
		this.name = "hideage";
		this.help = "Hide your age.";
		this.arguments = "<true/false>";
		this.category = new Category("Utilities");

		this.db = databaseMethods;
		this.birthdayMessages = birthdayMessages;
	}

	@Override
	protected void execute(CommandEvent event) {
		String[] args = event.getMessage().getContentRaw().split(" ");
		TextChannel channel = event.getTextChannel();

		if (args.length < 3) {
			birthdayMessages.invalidSetFormat(channel, getName(), getArguments());
			return;
		}

		if (args[2].equalsIgnoreCase("t") || args[2].equalsIgnoreCase("true") || args[2].equals("1")) {
			db.updateHideAge(event.getAuthor(), 1);
			birthdayMessages.setHideAge(channel, true);
		} else if (args[2].equalsIgnoreCase("f") || args[2].equalsIgnoreCase("false") || args[2].equals("0")) {
			db.updateHideAge(event.getAuthor(), 0);
			birthdayMessages.setHideAge(channel, false);
		} else
			birthdayMessages.invalidSetFormat(channel, getName(), getArguments());
	}
}
