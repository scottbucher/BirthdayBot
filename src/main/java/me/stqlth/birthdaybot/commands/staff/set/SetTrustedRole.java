package me.stqlth.birthdaybot.commands.staff;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.EmbedSender;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.TextChannel;

import java.awt.*;

public class SetTrustedRole extends Command {

	private DatabaseMethods db;

	public SetTrustedRole(DatabaseMethods databaseMethods) {
		this.name = "settrustedrole";
		this.help = "Set the trusted role";
		this.arguments = "<@role/role name>";
		this.guildOnly = true;
		this.hidden = true;

		this.db = databaseMethods;
	}

	@Override
	protected void execute(CommandEvent event) {
		TextChannel channel = event.getTextChannel();

		Member sender = event.getMember();
		Permission req = Permission.ADMINISTRATOR;

		if (!sender.hasPermission(req)) {
			EmbedSender.sendEmbed(channel, null, "Only Admins may use this command!", Color.RED);
			return;
		}

		String[] args = event.getMessage().getContentRaw().split(" ");

		if (args.length != 3) {
			EmbedSender.sendEmbed(channel, null, "Incorrect Usage. \nExample Usage: `bday " + this.name + " " + this.arguments +"`", Color.RED);
			return;
		}

		Role trustedRole;

		try {
			trustedRole = event.getMessage().getMentionedRoles().get(0);
		} catch (IndexOutOfBoundsException e) {
			trustedRole = event.getGuild().getRoles().stream().filter(role -> role.getName().toLowerCase().contains(args[2].toLowerCase())).findFirst().orElse(null);
		}

		if (trustedRole == null) {
			EmbedSender.sendEmbed(channel, null, "The specified role cannot be found.", Color.RED);
			return;
		}

		db.updateTrustedRole(event, trustedRole);
		EmbedSender.sendEmbed(channel, null, "Successfully set the trusted role to " + trustedRole.getAsMention() + "**!", Color.decode("#1CFE86"));
	}
}
