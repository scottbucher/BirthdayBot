package me.stqlth.birthdaybot.commands.user;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;

import static me.stqlth.birthdaybot.utils.Utilities.isPrivate;

public class Support extends Command {

	private BirthdayMessages birthdayMessages;

	public Support(BirthdayMessages birthdayMessages) {
		this.name = "support";
		this.guildOnly = false;
		this.help = "Join the BirthdayBot support server";
		this.category = new Category("Utilities");

		this.birthdayMessages = birthdayMessages;
	}

	@Override
	protected void execute(CommandEvent event) {
		String[] args = event.getMessage().getContentRaw().split(" ");

		if (args.length != 2) return;

		if (!isPrivate(event)) birthdayMessages.joinSupportServer(event.getTextChannel()); else birthdayMessages.joinSupportServer(event.getPrivateChannel());
	}
}
