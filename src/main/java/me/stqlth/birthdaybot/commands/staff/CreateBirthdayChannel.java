package me.stqlth.birthdaybot.commands.staff;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.EmbedSender;
import me.stqlth.birthdaybot.utils.Logger;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.exceptions.PermissionException;

import java.awt.*;
import java.util.EnumSet;

public class CreateBirthdayChannel extends Command {

	private DatabaseMethods db;

	public CreateBirthdayChannel(DatabaseMethods databaseMethods) {
		this.name = "createbirthdaychannel";
		this.help = "Creates a birthday channel";
		this.guildOnly = true;
		this.hidden = true;

		this.db = databaseMethods;
	}

	@Override
	protected void execute(CommandEvent event) {
		TextChannel channel = event.getTextChannel();
		Guild guild = event.getGuild();

		Member sender = event.getMember();

		Permission req = Permission.ADMINISTRATOR;
		Permission botReq = Permission.MANAGE_CHANNEL;

		if (!sender.hasPermission(req)) {
			EmbedSender.sendEmbed(channel, null, "Only Admins may use this command!", Color.RED);
			return;
		}

		EnumSet<Permission> grantPublic = EnumSet.of(Permission.VIEW_CHANNEL), //Application Permissions
				denyPublic = EnumSet.of(Permission.MESSAGE_WRITE);
		Role publicRole = event.getGuild().getPublicRole();

		event.getGuild().createTextChannel("birthdays")
				.setTopic("Birthday Announcements!")
				.addPermissionOverride(publicRole, grantPublic, denyPublic)
				.queue(result -> {
					db.updateBirthdayChannel(event, result);
					EmbedSender.sendEmbed(channel, null, "Successfully created the birthday channel **" + result.getAsMention() + "**!", Color.decode("#1CFE86"));
				}, error -> {
					if (error instanceof PermissionException) {
						EmbedSender.sendEmbed(channel, null, "**BirthdayBot** does not have permission to create a channel!", Color.RED);
					} else {
						Logger.Error("Could not create a birthday channel for " + guild.getName() + "(" + guild.getId() + ")", error);
					}
				});
	}
}
