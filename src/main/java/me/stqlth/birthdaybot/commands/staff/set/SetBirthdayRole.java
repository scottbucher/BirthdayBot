package me.stqlth.birthdaybot.commands.staff.set;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.EmbedSender;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.TextChannel;

import java.awt.*;

public class SetBirthdayRole extends Command {

	private DatabaseMethods db;

	public SetBirthdayRole(DatabaseMethods databaseMethods) {
		this.name = "setbirthdayrole";
		this.help = "Set the birthday role";
		this.arguments = "<@role/role name>";
		this.guildOnly = true;
		this.hidden = true;
		this.botPermissions = new Permission[]{Permission.MESSAGE_WRITE};

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

		Role bdayRole;

		try {
			bdayRole = event.getMessage().getMentionedRoles().get(0);
		} catch (IndexOutOfBoundsException e) {
			bdayRole = event.getGuild().getRoles().stream().filter(role -> role.getName().toLowerCase().contains(args[2].toLowerCase())).findFirst().orElse(null);
		}

		if (bdayRole == null) {
			EmbedSender.sendEmbed(channel, null, "The specified role cannot be found.", Color.RED);
			return;
		}

		db.updateBirthdayRole(event, bdayRole);
		String message = "Successfully set the birthday role **" + bdayRole.getAsMention() + "**!" +
				"\n" +
				"\nNote: Please move <@656621136808902656>'s Role to the top of the role list and move the new Birthday Role under" +
				"<@656621136808902656>'s Role.";
		EmbedSender.sendEmbed(event.getTextChannel(), null, message, Color.decode("#1CFE86"));
	}
}
