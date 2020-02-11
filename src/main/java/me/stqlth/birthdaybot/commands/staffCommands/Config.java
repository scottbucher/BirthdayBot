package me.stqlth.birthdaybot.commands.staffCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.StaffMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.TextChannel;

public class Config extends Command {

	private DatabaseMethods db;
	private StaffMessages staffMessages;

	public Config(DatabaseMethods databaseMethods, StaffMessages staffMessages) {
		this.name = "config";
		this.help = "Set the birthday message channel";
		this.arguments = "[#channel]";
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

		if (args[2].equalsIgnoreCase("trusted")) {
			if (args[3].equalsIgnoreCase("preventRole")) {
				if (args[4].equalsIgnoreCase("t") || args[4].equalsIgnoreCase("true") || args[4].equals("1")) {
					db.updatePreventRole(event, 1);
					staffMessages.setPreventRole(channel, true);
				} else if (args[4].equalsIgnoreCase("f") || args[4].equalsIgnoreCase("false") || args[4].equals("0")) {
					db.updatePreventRole(event, 0);
					staffMessages.setPreventRole(channel, false);
				}
			} else if (args[3].equalsIgnoreCase("preventMessage")) {
				if (args[4].equalsIgnoreCase("t") || args[4].equalsIgnoreCase("true") || args[4].equals("1")) {
					db.updatePreventMessage(event, 1);
					staffMessages.setPreventMessage(channel, true);
				} else if (args[4].equalsIgnoreCase("f") || args[4].equalsIgnoreCase("false") || args[4].equals("0")) {
					db.updatePreventMessage(event, 0);
					staffMessages.setPreventMessage(channel, false);
				}
			}
		}


	}
}
