package me.stqlth.birthdaybot.commands.staff;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.EmbedSender;
import me.stqlth.birthdaybot.utils.Utilities;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.exceptions.InsufficientPermissionException;

import java.awt.*;

public class Config extends Command {

	private DatabaseMethods db;

	public Config(DatabaseMethods databaseMethods) {
		this.name = "config";
		this.help = "Configures server settings";
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

		try {
			if (!sender.hasPermission(req)) {
				String message = "Only Admins may use this command!";
				EmbedSender.sendEmbed(channel, null, message, Color.RED);
				return;
			}

			String[] args = event.getMessage().getContentRaw().split(" ");
			if (args.length <= 2) return;

			if (args[2].equalsIgnoreCase("trusted") && args.length == 5) {
				if (args[3].equalsIgnoreCase("preventRole")) {

					if (args[4].equalsIgnoreCase("t") || args[4].equalsIgnoreCase("true") || args[4].equals("1")) {
						db.updatePreventRole(event, 1);

						String message = "**BirthdayBot** will only grant the birthday role with users with the trusted role now!";
						EmbedSender.sendEmbed(channel, null, message, Color.decode("#1CFE86"));

					} else if (args[4].equalsIgnoreCase("f") || args[4].equalsIgnoreCase("false") || args[4].equals("0")) {
						db.updatePreventRole(event, 0);

						String message = "**BirthdayBot** will grant the birthday role to all users regardless of if the user has the trusted role!";
						EmbedSender.sendEmbed(channel, null, message, Color.decode("#1CFE86"));

					}
				} else if (args[3].equalsIgnoreCase("preventMessage")) {
					if (args[4].equalsIgnoreCase("t") || args[4].equalsIgnoreCase("true") || args[4].equals("1")) {
						db.updatePreventMessage(event, 1);

						String message = "**BirthdayBot** will only send messages for users with the trusted role now!";
						EmbedSender.sendEmbed(channel, null, message, Color.decode("#1CFE86"));

					} else if (args[4].equalsIgnoreCase("f") || args[4].equalsIgnoreCase("false") || args[4].equals("0")) {
						db.updatePreventMessage(event, 0);

						String message = "**BirthdayBot** will send birthday messages to all users regardless of if the user has the trusted role!";
						EmbedSender.sendEmbed(channel, null, message, Color.decode("#1CFE86"));

					}
				}
			}
			if (args[2].equalsIgnoreCase("message")) {


				if (args[3].equalsIgnoreCase("setMention")) {
					switch (args[4].toLowerCase()) {
						case "everyone":
							db.updateMentionedSetting(event, "everyone");

							EmbedSender.sendEmbed(channel, null, "The birthday message will now mention @everyone!", Color.decode("#1CFE86"));
							break;
						case "here":
							db.updateMentionedSetting(event, "here");

							EmbedSender.sendEmbed(channel, null, "The birthday message will now mention @here!", Color.decode("#1CFE86"));
							break;
						case "disable":
							db.updateMentionedSetting(event, "0");

							EmbedSender.sendEmbed(channel, null, "The birthday message will no longer mention anyone!", Color.decode("#1CFE86"));
							break;
						default:
							Role mentionedRole;
							try {
								mentionedRole = event.getMessage().getMentionedRoles().get(0);
							} catch (IndexOutOfBoundsException e) {
								mentionedRole = event.getGuild().getRoles().stream().filter(role -> role.getName().toLowerCase().contains(args[3].toLowerCase())).findFirst().orElse(null);
							}
							if (mentionedRole == null) {
								EmbedSender.sendEmbed(channel, null, "The specified role cannot be found.", Color.RED);
								return;
							}
							if (!mentionedRole.isMentionable()) {
								EmbedSender.sendEmbed(channel, null, "The specified role is not mentionable. Please change this in your role settings.", Color.RED);
								return;
							}


							db.updateMentionedSetting(event, mentionedRole.getId());
							EmbedSender.sendEmbed(channel, null, "The birthday message will now mention " + mentionedRole.getAsMention() + "!", Color.decode("#1CFE86"));
							break;
					}
				} else if (args[3].equalsIgnoreCase("setTime")) {
					int messageTime = 0;
					try {
						messageTime = Integer.parseInt(args[4]);
					} catch (NumberFormatException e) {
						EmbedSender.sendEmbed(channel, null, "Your time was invalid. \nExample usage: `bday config messageTime <0-23>`", Color.RED);
						return;
					}

					if (messageTime < 0 || messageTime >= 23) {
						EmbedSender.sendEmbed(channel, null, "Your time was invalid. \nExample usage: `bday config messageTime <0-23>`", Color.RED);
						return;
					}
					db.updateGuildMessageTime(event.getGuild(), messageTime);

					String timeMessage;
					if (messageTime == 0) timeMessage = "12:00 AM";
					else if (messageTime < 12) timeMessage = messageTime + ":00 AM";
					else timeMessage = (messageTime - 12) + ":00 PM";
					EmbedSender.sendEmbed(channel, null, "Successfully set the Birthday Messages to send at " + timeMessage, Color.decode("#1CFE86"));

				} else if (args[3].equalsIgnoreCase("set")) {
					StringBuilder message = new StringBuilder(args[4]);

					for (int i = 5; i < args.length; i++)
						message.append(" ").append(args[i]);

					if (message.length() > 2000) {
						EmbedSender.sendEmbed(channel, null, "The birthday message is too large.", Color.RED);
						return;
					}
					String bMessage = message.toString().replaceAll("@users", "@Users");
					db.updateMessage(event, bMessage);
					EmbedSender.sendEmbed(channel, null, "Successfully set the birthday message to **" + bMessage + "**\nTest this with `bday testMessage`!", Color.decode("#1CFE86"));
				} else if (args[3].equalsIgnoreCase("reset") && args.length == 4) {

					db.updateMessage(event, "0");
					EmbedSender.sendEmbed(channel, null, "Successfully reset the birthday message to it's default value!\nTest this with `bday testMessage`!", Color.decode("#1CFE86"));
				} else if (args[3].equalsIgnoreCase("useEmbed")) {
					if (args[4].equalsIgnoreCase("t") || args[4].equalsIgnoreCase("true") || args[4].equals("1")) {
						db.updateUseEmbed(event, 1);

						String message = "**BirthdayBot** will now embed the birthday message!\nTest this with `bday testMessage`!";
						EmbedSender.sendEmbed(channel, null, message, Color.decode("#1CFE86"));

					} else if (args[4].equalsIgnoreCase("f") || args[4].equalsIgnoreCase("false") || args[4].equals("0")) {
						db.updateUseEmbed(event, 0);

						String message = "**BirthdayBot** will no longer embed the birthday message!\nTest this with `bday testMessage`!";
						EmbedSender.sendEmbed(channel, null, message, Color.decode("#1CFE86"));

					}

				}
			}
		} catch (InsufficientPermissionException ignored) {
		}
	}

}
