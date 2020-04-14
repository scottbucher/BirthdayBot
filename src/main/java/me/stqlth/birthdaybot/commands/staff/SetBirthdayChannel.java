package me.stqlth.birthdaybot.commands.staff;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.StaffMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.TextChannel;

public class SetChannel extends Command {

	private DatabaseMethods db;
	private StaffMessages staffMessages;

	public SetChannel(DatabaseMethods databaseMethods, StaffMessages staffMessages) {
        this.name = "setchannel";
        this.help = "Set the birthday message channel";
		this.arguments = "[#channel]";
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

		String[] args = event.getMessage().getContentRaw().split(" ");

		if (args.length > 4) return;

		TextChannel bdayChannel;

		try {
			bdayChannel = event.getMessage().getMentionedChannels().get(0);
		} catch (IndexOutOfBoundsException e) {
			bdayChannel = event.getTextChannel();
		}

		db.updateBirthdayChannel(event, bdayChannel);

		staffMessages.successChannel(channel, bdayChannel);
	}
}
