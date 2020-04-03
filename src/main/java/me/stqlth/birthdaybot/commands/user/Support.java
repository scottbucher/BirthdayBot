package me.stqlth.birthdaybot.commands.user;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;

import static me.stqlth.birthdaybot.utils.Utilities.isPrivate;

public class Support extends Command {

	public Support() {
		this.name = "support";
		this.guildOnly = false;
		this.help = "Join the BirthdayBot support server";
		this.category = new Category("Utilities");
	}

	@Override
	protected void execute(CommandEvent event) {
		String[] args = event.getMessage().getContentRaw().split(" ");

		if (args.length != 2) return;

		if (!isPrivate(event)) BirthdayMessages.joinSupportServer(event.getTextChannel()); else BirthdayMessages.joinSupportServer(event.getPrivateChannel());
	}
}
