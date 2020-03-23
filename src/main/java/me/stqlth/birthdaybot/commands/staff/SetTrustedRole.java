package me.stqlth.birthdaybot.commands.staff;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.StaffMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.TextChannel;

public class SetTrustedRole extends Command {

	private DatabaseMethods db;
	private StaffMessages staffMessages;

	public SetTrustedRole(DatabaseMethods databaseMethods, StaffMessages staffMessages) {
		this.name = "settrustedrole";
		this.help = "Set the trusted role";
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

		if (args.length != 3) {
			staffMessages.sendErrorMessage(channel, getName(), arguments);
			return;
		}

		Role trustedRole;

		try {
			trustedRole = event.getMessage().getMentionedRoles().get(0);
		} catch (IndexOutOfBoundsException e) {
			trustedRole = event.getGuild().getRoles().stream().filter(role -> role.getName().toLowerCase().contains(args[2].toLowerCase())).findFirst().orElse(null);
		}

		if (trustedRole == null) {
			staffMessages.roleNotFound(channel);
			return;
		}

		db.updateTrustedRole(event, trustedRole);
		staffMessages.successTrustedRole(channel, trustedRole);
	}
}
