package me.stqlth.birthdaybot.commands.staff.set;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.EmbedSender;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.TextChannel;

import java.awt.*;

public class SetBirthdayChannel extends Command {

	private DatabaseMethods db;

	public SetBirthdayChannel(DatabaseMethods databaseMethods) {
        this.name = "setbirthdaychannel";
        this.help = "Set the birthday message channel";
		this.arguments = "[#channel]";
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

		if (args.length > 4) return;

		TextChannel bdayChannel;

		try {
			bdayChannel = event.getMessage().getMentionedChannels().get(0);
		} catch (IndexOutOfBoundsException e) {
			bdayChannel = event.getTextChannel();
		}

		db.updateBirthdayChannel(event, bdayChannel);

		EmbedSender.sendEmbed(channel, null, "Successfully set the birthday channel to " + bdayChannel.getAsMention() + "!", Color.decode("#1CFE86"));
	}
}
