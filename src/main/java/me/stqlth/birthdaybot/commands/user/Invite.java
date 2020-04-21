package me.stqlth.birthdaybot.commands.user;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.utils.EmbedSender;

import static me.stqlth.birthdaybot.utils.Utilities.isPrivate;

public class Invite extends Command {

	public Invite() {
		this.name = "invite";
		this.aliases = new String[]{"inv"};
		this.guildOnly = false;
		this.help = "Invite Birthday bot to your server";
		this.category = new Category("Utilities");
	}

	@Override
	protected void execute(CommandEvent event) {
		String[] args = event.getMessage().getContentRaw().split(" ");

		if (args.length != 2) return;

		String message = "Invite BirthdayBot to your server [here](https://discordapp.com/api/oauth2/authorize?client_id=656621136808902656&permissions=269053008&scope=bot)!";

		if (!isPrivate(event)) EmbedSender.sendEmbed(event.getTextChannel(), null, message, null);
		else EmbedSender.sendEmbed(event.getPrivateChannel(), null, message, null);
	}
}
