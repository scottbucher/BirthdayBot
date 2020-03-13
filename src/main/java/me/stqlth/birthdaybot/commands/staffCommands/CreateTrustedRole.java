package me.stqlth.birthdaybot.commands.staffCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.StaffMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.exceptions.InsufficientPermissionException;

public class CreateTrustedRole extends Command {

	private DatabaseMethods db;
	private StaffMessages staffMessages;

	public CreateTrustedRole(DatabaseMethods databaseMethods, StaffMessages staffMessages) {
		this.name = "createtrustedrole";
		this.help = "Creates a trusted role";
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
		Permission botReq = Permission.MANAGE_ROLES;

		if (!sender.hasPermission(req)) {
			staffMessages.onlyAdmins(channel); //Only admins may use this command
			return;
		}

		if (!event.getSelfMember().hasPermission(botReq)) {
			try {
				staffMessages.botNoPerms(channel);
			} catch (InsufficientPermissionException ignored) {}
		}

		event.getGuild().createRole()
				.setName("BirthdayTrusted")
				.queue(result -> {
					staffMessages.successTrustedRoleCreate(channel, result);
					db.updateTrustedRole(event, result);
				});
	}
}
