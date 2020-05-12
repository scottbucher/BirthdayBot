package me.stqlth.birthdaybot.commands.user;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import com.jagrosh.jdautilities.commons.waiter.EventWaiter;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.EmbedSender;
import me.stqlth.birthdaybot.utils.ErrorManager;
import me.stqlth.birthdaybot.utils.Utilities;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Message;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.events.message.react.MessageReactionAddEvent;

import java.awt.*;
import java.util.Objects;

public class Clear extends Command {
	private EventWaiter waiter;
	private DatabaseMethods db;

	public Clear(EventWaiter waiter, DatabaseMethods databaseMethods) {
		this.name = "clear";
		this.help = "Removes a user's data from the database.";
		this.guildOnly = false;
		this.category = new Category("Utilities");
		this.botPermissions = new Permission[]{Permission.MESSAGE_WRITE, Permission.MESSAGE_ADD_REACTION, Permission.MESSAGE_EMBED_LINKS, Permission.MESSAGE_MANAGE};

		this.waiter = waiter;
		this.db = databaseMethods;
	}

	@Override
	protected void execute(CommandEvent event) {
		boolean normal = !Utilities.isPrivate(event);

		User author = event.getAuthor();

		int changesLeft = db.getChangesLeft(author);

		getConfirmation(event, author, normal, changesLeft);
	}

	public void getConfirmation(CommandEvent event, User author, boolean normal, int changesLeft) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.RED)
				.setAuthor(author.getName() + "#" + author.getDiscriminator(), null, author.getAvatarUrl())
				.setTitle("**Clear User Data**")
				.setDescription(" This command will remove both your timezone and your birthday from the BirthdayBot database." +
						"However, please note this will __not__ reset your birthday set count. (You have __" + changesLeft + "__ birthday change(s) left).")
				.addField("Options", "\u2705 Confirm\n\u274C Cancel", false)
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		if (normal)
			event.getTextChannel().sendMessage(builder.build()).queue(result -> {
				result.addReaction("\u2705").queue(null, ErrorManager.GENERAL);
				result.addReaction("\u274C").queue(null, ErrorManager.GENERAL);
				waitForConfirmation(event, result, true);
			}, ErrorManager.GENERAL);
		else
			event.getPrivateChannel().sendMessage(builder.build()).queue(result -> {
				result.addReaction("\u2705").queue(null, ErrorManager.PRIVATE);
				result.addReaction("\u274C").queue(null, ErrorManager.PRIVATE);
				waitForConfirmation(event, result, false);
			}, ErrorManager.GENERAL);

	}

	private void waitForConfirmation(CommandEvent event, Message msg, boolean normal) {

		waiter.waitForEvent(MessageReactionAddEvent.class,
				e -> e.getChannel().equals(event.getChannel()) && !Objects.requireNonNull(e.getUser()).isBot() &&
						((e.getReactionEmote().getName().equals("\u2705") || e.getReactionEmote().getName().equals("\u274C")) && Objects.equals(e.getMember(), event.getMember())),
				e -> {
					if (e.getReactionEmote().getName().equals("\u2705")) {
							db.clearBirthday(event.getAuthor());
							db.clearZoneId(event);
							msg.delete().queue(null, ErrorManager.GENERAL);
							if (normal)
								EmbedSender.sendEmbed(event.getTextChannel(), null, "Successfully purged your data from the database.", Color.decode("#1CFE86"));
							else
								EmbedSender.sendEmbed(event.getPrivateChannel(), null, "Successfully purged your data from the database.", Color.decode("#1CFE86"));
					} else if (e.getReactionEmote().getName().equals("\u274C")) {
						msg.delete().queue(null, ErrorManager.GENERAL);
						if (normal) {
							EmbedSender.sendEmbed(event.getTextChannel(), null, "Request Canceled", Color.RED);
						} else EmbedSender.sendEmbed(event.getPrivateChannel(), null, "Request Canceled", Color.RED);

					}
				});
	}


}
