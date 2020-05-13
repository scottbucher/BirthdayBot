package me.stqlth.birthdaybot.commands.user;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.EmbedSender;
import me.stqlth.birthdaybot.utils.Utilities;

import java.awt.*;

public class ViewSets extends Command
{

	private DatabaseMethods db;

	public ViewSets(DatabaseMethods databaseMethods) {
		this.name = "viewSets";
		this.guildOnly = false;
		this.category = new Category("Utilities");
		this.help = "View how many birthday sets you have left.";


		this.db = databaseMethods;
	}

	@Override
	protected void execute(CommandEvent event) {
		boolean normal = !Utilities.isPrivate(event);

		int setsLeft = db.getChangesLeft(event.getAuthor());

		if (normal) EmbedSender.sendEmbed(event.getTextChannel(), null, "You have " + setsLeft + " birthday set(s) left.", Color.decode("#1CFE86"));
		else EmbedSender.sendEmbed(event.getPrivateChannel(), null, "You have " + setsLeft + " birthday set(s) left.", Color.decode("#1CFE86"));
	}
}
