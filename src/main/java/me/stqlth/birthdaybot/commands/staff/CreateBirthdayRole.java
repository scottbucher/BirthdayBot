package me.stqlth.birthdaybot.commands.staff;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.EmbedSender;
import me.stqlth.birthdaybot.utils.Logger;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.exceptions.PermissionException;

import java.awt.*;

public class CreateBirthdayRole extends Command {

	private DatabaseMethods db;

	public CreateBirthdayRole(DatabaseMethods databaseMethods) {
		this.name = "createbirthdayrole";
		this.help = "Creates a birthday role";
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

		if (!sender.hasPermission(req)) {
			EmbedSender.sendEmbed(channel, null, "Only Admins may use this command!", Color.RED);
			return;
		}

			event.getGuild().createRole()
					.setName("\uD83C\uDF82")
					.setColor(Color.decode("#AC1CFE"))
					.setHoisted(true)
					.queue(result -> {
						db.updateBirthdayRole(event, result);
						EmbedSender.sendEmbed(channel, null, "Successfully created the birthday role **" + result.getAsMention() + "**!", Color.decode("#1CFE86"));
					}, error -> {
						if (error instanceof PermissionException) {
							EmbedSender.sendEmbed(channel, null, "**BirthdayBot** does not have permission to create a role!", Color.RED);
						} else {
							Logger.Error("Could not create a birthday role for " + guild.getName() + "(" + guild.getId() + ")", error);
						}
					});

	}
}
