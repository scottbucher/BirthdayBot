package me.stqlth.birthdaybot.commands.staffCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.StaffMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.Utilities;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.*;

import java.awt.*;
import java.util.Objects;

public class Config extends Command {

	private DatabaseMethods db;
	private StaffMessages staffMessages;

	public Config(DatabaseMethods databaseMethods, StaffMessages staffMessages) {
		this.name = "config";
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
		if (args.length <= 2) return;

		if (args[2].equalsIgnoreCase("trusted") && args.length == 5) {
			if (args[3].equalsIgnoreCase("preventRole")) {
				if (args[4].equalsIgnoreCase("t") || args[4].equalsIgnoreCase("true") || args[4].equals("1")) {
					db.updatePreventRole(event, 1);
					staffMessages.setPreventRole(channel, true);
				} else if (args[4].equalsIgnoreCase("f") || args[4].equalsIgnoreCase("false") || args[4].equals("0")) {
					db.updatePreventRole(event, 0);
					staffMessages.setPreventRole(channel, false);
				}
			} else if (args[3].equalsIgnoreCase("preventMessage")) {
				if (args[4].equalsIgnoreCase("t") || args[4].equalsIgnoreCase("true") || args[4].equals("1")) {
					db.updatePreventMessage(event, 1);
					staffMessages.setPreventMessage(channel, true);
				} else if (args[4].equalsIgnoreCase("f") || args[4].equalsIgnoreCase("false") || args[4].equals("0")) {
					db.updatePreventMessage(event, 0);
					staffMessages.setPreventMessage(channel, false);
				}
			}
		} else if (args[2].equalsIgnoreCase("mentionSetting") && args.length == 4) {
			switch (args[3].toLowerCase()) {
				case "everyone":
					db.updateMentionedSetting(event, "everyone");
					staffMessages.successMentionSetting(channel, "everyone");
					break;
				case "here":
					db.updateMentionedSetting(event, "here");
					staffMessages.successMentionSetting(channel, "here");
					break;
				case "disable":
					db.updateMentionedSetting(event, "0");
					staffMessages.disableMentionSetting(channel);
					break;
				default:
					Role mentionedRole;
					try {
						mentionedRole = event.getMessage().getMentionedRoles().get(0);
					} catch (IndexOutOfBoundsException e) {
						mentionedRole = event.getGuild().getRoles().stream().filter(role -> role.getName().toLowerCase().contains(args[3].toLowerCase())).findFirst().orElse(null);
					}
					if (mentionedRole == null) {
						staffMessages.roleNotFound(channel);
						return;
					}
					if (!mentionedRole.isMentionable()) {
						staffMessages.roleNotMentionable(channel);
						return;
					}


					db.updateMentionedSetting(event, mentionedRole.getId());
					staffMessages.successRoleMentionSetting(channel, mentionedRole);
					break;
			}
		} else if (args[2].equalsIgnoreCase("messageTime") && args.length == 4) {
			int messageTime = 0;
			try {
				messageTime = Integer.parseInt(args[3]);
			} catch (NumberFormatException e) {
				staffMessages.invalidTime(channel, "config messageTime", "<0-23>");
				 return;
			}

			if (messageTime < 0 || messageTime > 23) {
				staffMessages.invalidTime(channel, "config messageTime", "<0-23>");
				return;
			}
			db.updateGuildMessageTime(event.getGuild(), messageTime);
			staffMessages.successMessageTime(channel, messageTime);
		} else if (args[2].equalsIgnoreCase("setMessage") && args.length >= 4) {
			StringBuilder message = new StringBuilder(args[3]);

			for (int i = 4; i < args.length; i++)
				message.append(" ").append(args[i]);

			if (message.length() > 2000) {
				staffMessages.messageTooLarge(channel);
				return;
			}

			db.updateMessage(event, message.toString());
			staffMessages.successMessage(channel, message.toString());
		} else if (args[2].equalsIgnoreCase("resetMessage") && args.length == 3) {

			db.updateMessage(event, "0");
			staffMessages.resetMessage(channel);
		}
	}

}
