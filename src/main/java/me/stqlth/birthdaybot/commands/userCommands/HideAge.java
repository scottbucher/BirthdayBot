package me.stqlth.birthdaybot.commands.userCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.entities.PrivateChannel;
import net.dv8tion.jda.api.entities.TextChannel;

import java.util.Objects;

public class HideAge extends Command {
	private BirthdayMessages birthdayMessages;
	private DatabaseMethods db;

	public HideAge(DatabaseMethods databaseMethods, BirthdayMessages birthdayMessages) {
		this.name = "hideage";
		this.help = "Hide your age.";
		this.guildOnly = false;
		this.arguments = "<true/false>";
		this.category = new Category("Utilities");

		this.db = databaseMethods;
		this.birthdayMessages = birthdayMessages;
	}

	@Override
	protected void execute(CommandEvent event) {
		String[] args = event.getMessage().getContentRaw().split(" ");
		TextChannel textChannel = null;
		PrivateChannel privateChannel = null;

		try {
			textChannel = event.getTextChannel();
		} catch (IllegalStateException ignored) {
			privateChannel = event.getPrivateChannel();
		}
		boolean normal = true;

		if (privateChannel != null) normal = false;

		if (args.length < 3) {
			if (normal) birthdayMessages.invalidSetFormat(Objects.requireNonNull(textChannel), getName(), getArguments()); else birthdayMessages.invalidSetFormat(privateChannel, getName(), getArguments());
			return;
		}

		if (args[2].equalsIgnoreCase("t") || args[2].equalsIgnoreCase("true") || args[2].equals("1")) {
			db.updateHideAge(event.getAuthor(), 1);
			if (normal) birthdayMessages.setHideAge(textChannel, true); else birthdayMessages.setHideAge(privateChannel, true);
		} else if (args[2].equalsIgnoreCase("f") || args[2].equalsIgnoreCase("false") || args[2].equals("0")) {
			db.updateHideAge(event.getAuthor(), 0);
			if (normal) birthdayMessages.setHideAge(textChannel, false); else birthdayMessages.setHideAge(privateChannel, false);
		} else
			if (normal) birthdayMessages.invalidSetFormat(Objects.requireNonNull(textChannel), getName(), getArguments()); else birthdayMessages.invalidSetFormat(privateChannel, getName(), getArguments());
	}
}
