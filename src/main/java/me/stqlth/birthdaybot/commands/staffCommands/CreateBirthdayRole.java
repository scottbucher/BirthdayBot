package me.stqlth.birthdaybot.commands.staffCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.StaffMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.TextChannel;

import java.awt.*;
import java.util.EnumSet;

public class CreateBirthdayRole extends Command {

	private DatabaseMethods db;
	private StaffMessages staffMessages;

	public CreateBirthdayRole(DatabaseMethods databaseMethods, StaffMessages staffMessages) {
		this.name = "createbirthdayrole";
		this.help = "Creates a birthday role";
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

		event.getGuild().createRole()
				.setName("\uD83C\uDF82")
				.setColor(Color.decode("#AC1CFE"))
				.setHoisted(true)
				.queue(result -> {
					staffMessages.successBdayRoleCreate(channel, result);
					db.updateBirthdayRole(event, result);
				});

	}
}
