package me.stqlth.birthdaybot.commands.staffCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.StaffMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.TextChannel;

import java.util.EnumSet;

public class CreateChannel extends Command {

	private DatabaseMethods db;
	private StaffMessages staffMessages;

	public CreateChannel(DatabaseMethods databaseMethods, StaffMessages staffMessages) {
		this.name = "createchannel";
		this.help = "Creates a birthday channel";
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

		EnumSet<Permission> grantPublic = EnumSet.of(Permission.VIEW_CHANNEL), //Application Permissions
				denyPublic = EnumSet.of(Permission.MESSAGE_WRITE);
		Role publicRole = event.getGuild().getPublicRole();

		event.getGuild().createTextChannel("birthdays")
				.setTopic("Birthday Announcements!")
				.addPermissionOverride(publicRole, grantPublic, denyPublic)
				.queue(result -> {
					staffMessages.successChannelCreate(channel, result);
					db.updateBirthdayChannel(event, result);
		});

	}
}
