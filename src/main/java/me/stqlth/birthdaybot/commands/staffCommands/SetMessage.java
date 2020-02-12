package me.stqlth.birthdaybot.commands.staffCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.StaffMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.TextChannel;

public class SetMessage extends Command {

	private DatabaseMethods db;
	private StaffMessages staffMessages;

	public SetMessage(DatabaseMethods databaseMethods, StaffMessages staffMessages) {
		this.name = "setmessage";
		this.help = "Set a custom birthday message";
		this.arguments = "<message>";
		this.guildOnly = true;
		this.hidden = true;

		this.db = databaseMethods;
		this.staffMessages = staffMessages;
	}


	@Override
	protected void execute(CommandEvent event) {
		TextChannel channel = event.getTextChannel();

		Member sender = event.getMember();
		Permission req = Permission.ADMINISTRATOR;

		if (!sender.hasPermission(req)) {
			staffMessages.onlyAdmins(channel); //Only admins may use this command
			return;
		}

		String[] args = event.getMessage().getContentRaw().split(" ");

		if (args.length < 3) {
			staffMessages.sendMessageError(channel, getName(), getArguments());
			return;
		}

		StringBuilder message = new StringBuilder(args[2]);

		for (int i = 3; i < args.length; i++)
			message.append(" ").append(args[i]);

		if (message.length() > 2000) {
			staffMessages.messageTooLarge(channel);
			return;
		}

		db.updateMessage(event, message.toString());
		staffMessages.successMessage(channel, message.toString());
	}
}
