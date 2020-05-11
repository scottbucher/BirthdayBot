package me.stqlth.birthdaybot.commands.user;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.utils.EmbedSender;
import net.dv8tion.jda.api.Permission;

import java.awt.*;

import static me.stqlth.birthdaybot.utils.Utilities.isPrivate;

public class Support extends Command {

	public Support() {
		this.name = "support";
		this.guildOnly = false;
		this.help = "Join the BirthdayBot support server";
		this.category = new Category("Utilities");
		this.botPermissions = new Permission[]{Permission.MESSAGE_WRITE, Permission.MESSAGE_EMBED_LINKS};
	}

	@Override
	protected void execute(CommandEvent event) {
		String[] args = event.getMessage().getContentRaw().split(" ");

		if (args.length != 2) return;

		if (!event.getSelfMember().hasPermission(Permission.MESSAGE_WRITE)) return;

		if (!event.getSelfMember().hasPermission(Permission.MESSAGE_EMBED_LINKS)) {
			EmbedSender.sendEmbed(event.getTextChannel(), null, "**BirthdayBot** does not have permission to embed links!", Color.RED);
			return;
		}

		String message = "For support join our discord server [here](https://discord.gg/9gUQFtz)!";
		if (!isPrivate(event)) EmbedSender.sendEmbed(event.getTextChannel(), null, message, null);
		else EmbedSender.sendEmbed(event.getPrivateChannel(), null, message, null);
	}
}
