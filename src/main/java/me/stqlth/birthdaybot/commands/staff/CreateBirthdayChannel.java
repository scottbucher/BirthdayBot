package me.stqlth.birthdaybot.commands.staff;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.StaffMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.exceptions.InsufficientPermissionException;

import java.util.EnumSet;

public class CreateBirthdayChannel extends Command {

	private DatabaseMethods db;
	private StaffMessages staffMessages;

	public CreateBirthdayChannel(DatabaseMethods databaseMethods, StaffMessages staffMessages) {
		this.name = "createbirthdaychannel";
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
		Permission botReq = Permission.MANAGE_CHANNEL;

		if (!sender.hasPermission(req)) {
			staffMessages.onlyAdmins(channel); //Only admins may use this command
			return;
		}

		if (!event.getSelfMember().hasPermission(botReq)) {
			try {
				staffMessages.botNoPerms(channel);
			} catch (InsufficientPermissionException ignored) {}
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
