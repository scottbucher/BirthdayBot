package me.stqlth.birthdaybot.commands.developement;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.Logger;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.exceptions.PermissionException;

import javax.annotation.Nullable;
import java.awt.*;
import java.util.List;

public class Broadcast extends Command {

	private DatabaseMethods db;

	public Broadcast(DatabaseMethods databaseMethods) {
		this.name = "broadcast";
		this.guildOnly = true;
		this.hidden = true;
		this.ownerCommand = true;

		this.db = databaseMethods;
	}

	@Override
	protected void execute(CommandEvent event) {
		if (true) return;

		List<Guild> guilds = event.getJDA().getGuilds();
		for (Guild guild : guilds) {
			Logger.Info("Broadcasting to Guild: " + guild.getName());

			try {
				Thread.sleep(5000);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			long bdayChannel = db.getBirthdayChannel(guild);
			if (bdayChannel != 0) {
				TextChannel bChannel = null;
				try {
					bChannel = guild.getTextChannelById(bdayChannel);
				} catch (Exception ignored) {
				}

				if (bChannel != null) {
					String roleMention = db.getMentionSetting(guild);
					Role mRole = null;
					try {
						mRole = guild.getRoleById(roleMention);
					} catch (Exception ignored) {
					}
					if (!roleMention.equalsIgnoreCase("0")) {
						if (mRole != null) {
							bChannel.sendMessage(mRole.getAsMention()).queue(null, error -> {
								if (!(error instanceof PermissionException)) {
									Logger.Error("Failed to send message to a TextChannel with ID: " + event.getTextChannel().getId(), error);
								}
							});
						} else {
							bChannel.sendMessage("@" + roleMention).queue(null, error -> {
								if (!(error instanceof PermissionException)) {
									Logger.Error("Failed to send message to a TextChannel with ID: " + event.getTextChannel().getId(), error);
								}
							});
						}
					}
					broadcastUpdate(event, bChannel, null);
				}
			} else {
				Member discordOwner = guild.getOwner();
				if (discordOwner != null) {
					discordOwner.getUser().openPrivateChannel().queue(result -> broadcastUpdate(event, null, result));
				} else {
					List<Member> admins = guild.getMembers();
					admins.removeIf(member -> !member.hasPermission(Permission.ADMINISTRATOR));
					for (Member admin : admins) {
						if (admin != null) {
							admin.getUser().openPrivateChannel().queue(result -> broadcastUpdate(event, null, result));
							break;
						}
					}
				}
			}


		}

	}

	public static void broadcastUpdate(CommandEvent event, @Nullable TextChannel channel, @Nullable PrivateChannel privateChannel) {
		EmbedBuilder builder = new EmbedBuilder();
		SelfUser bot = event.getSelfUser();
		String botIcon = bot.getAvatarUrl();

		builder.setTitle("Major Update & Changes")
				.setColor(Color.decode("#1CFE86"))
				.setThumbnail(botIcon)
				.setAuthor("BirthdayBot", null, botIcon)
				.setDescription("Thank you for using BirthdayBot! As this bot was in beta there were bound to be some kinks and issues. " +
						"Unfortunately, recent updates and improvements have forced me to wipe user data, this will not happen again as the bot is moving out of beta " +
						"and into full release!" +
						"\n\n**I apologise if you have gotten this message more than once**")
				.addField("Update & Changes Which Caused the Data Reset", " - HEAVY Database Optimization" +
						"\n - Support for Leap Day Birthdays" +
						"\n - Abandoned GMT Offsets in favor of Specific Timezones, (Timezones give __more__ options and account for __daylight savings__)", false)
				.setFooter("If you have any questions/problems please join our support server with `bday support`", botIcon);
		if (channel != null) channel.sendMessage(builder.build()).queue(null, error -> {
			if (!(error instanceof PermissionException)) {
				Logger.Error("Failed to send message to a TextChannel with ID: " + channel.getId(), error);
			}
		});
		else if (privateChannel != null) privateChannel.sendMessage(builder.build()).queue(null, error -> {
			if (!(error instanceof PermissionException)) {
				Logger.Error("Failed to send message to a PrivateChannel with a User ID: " + privateChannel.getUser().getId(), error);
			}
		});
	}
}
