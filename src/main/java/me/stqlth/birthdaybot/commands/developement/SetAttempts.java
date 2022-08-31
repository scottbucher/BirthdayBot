package me.stqlth.birthdaybot.commands.developement;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.EmbedSender;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.TextChannel;

import java.awt.*;
import java.util.Arrays;
import java.util.List;

public class SetAttempts extends Command {

	private DatabaseMethods db;
	private List<String> developerList = Arrays.asList("478288246858711040", "212772875793334272");

	public SetAttempts(DatabaseMethods databaseMethods) {
		this.name = "setattempts";
		this.arguments = "<@User> <amount>";
		this.hidden = true;
		this.guildOnly = true;

		this.db = databaseMethods;
	}

	@Override
	protected void execute(CommandEvent event) {
		String userId = event.getAuthor().getId();

		if (!developerList.contains(userId)) {
			EmbedSender.sendEmbed(event.getTextChannel(), null, "Only <@656621136808902656>'s developers can run this command.", Color.RED);
			return;
		}

		String[] args = event.getMessage().getContentRaw().split(" ");

		if (args.length != 4) return;

		TextChannel channel = event.getTextChannel();

		Member target;

		try {
			target = event.getMessage().getMentionedMembers().get(0);
		} catch (Exception ignored) {
			target = event.getGuild().getMembers().stream().filter(member -> member.getEffectiveName().toLowerCase().contains(args[2].toLowerCase())).findFirst().orElse(null);
			if (target == null)
				target = event.getGuild().getMembers().stream().filter(member -> member.getUser().getName().toLowerCase().contains(args[2].toLowerCase())).findFirst().orElse(null);
		}

		if (target == null) {
			EmbedSender.sendEmbed(channel, null, "I can't find that user!", Color.RED);
			return;
		}

		int amount = -1;

		try {
			amount = Integer.parseInt(args[3]);
		} catch (NumberFormatException ex) {
			EmbedSender.sendEmbed(channel, null, "Please input a correct number.", Color.RED);
		}

		db.updateChangesLeft(target.getUser(), amount);
		EmbedSender.sendEmbed(channel, null, "Successfully set " + target.getUser().getAsMention() + "'s birthday sets to " + amount + "!", Color.decode("#1CFE86"));
	}
}
