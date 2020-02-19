package me.stqlth.birthdaybot.commands.userCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;

import static me.stqlth.birthdaybot.utils.Utilities.isPrivate;

public class Invite extends Command {

	private BirthdayMessages birthdayMessages;

	public Invite(BirthdayMessages birthdayMessages) {
		this.name = "invite";
		this.aliases = new String[]{"inv"};
		this.guildOnly = false;
		this.help = "Invite Birthday bot to your server";
		this.category = new Category("Utilities");

		this.birthdayMessages = birthdayMessages;
	}

	@Override
	protected void execute(CommandEvent event) {
		String[] args = event.getMessage().getContentRaw().split(" ");

		if (args.length != 2) return;

		if (!isPrivate(event)) birthdayMessages.inviteBot(event.getTextChannel()); else birthdayMessages.inviteBot(event.getPrivateChannel());
	}
}
