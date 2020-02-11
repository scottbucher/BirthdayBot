package me.stqlth.birthdaybot.commands.staffCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.StaffMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.TextChannel;

public class SetRole extends Command {

	private DatabaseMethods db;
	private StaffMessages staffMessages;

	public SetRole(DatabaseMethods databaseMethods, StaffMessages staffMessages) {
		this.name = "setrole";
		this.help = "Set the birthday message channel";
		this.arguments = "<@role/role name>";
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

		if (args.length > 3) return;

		Role bdayRole;

		try {
			bdayRole = event.getMessage().getMentionedRoles().get(0);
		} catch (IndexOutOfBoundsException e) {
			bdayRole = event.getGuild().getRoles().stream().filter(role -> role.getName().toLowerCase().contains(args[2])).findFirst().orElse(null);
		}

		if (bdayRole == null) {
			staffMessages.roleNotFound(channel);
			return;
		}

		db.updateBirthdayRole(event, bdayRole);
		staffMessages.successBdayRole(channel, bdayRole);

	}
}
