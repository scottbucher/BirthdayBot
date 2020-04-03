package me.stqlth.birthdaybot.commands.developement;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.DevelopmentMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.ErrorManager;
import me.stqlth.birthdaybot.utils.Logger;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.TextChannel;

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
						if (mRole != null) bChannel.sendMessage(mRole.getAsMention()).queue(null, ErrorManager.PERMISSION);
						else bChannel.sendMessage("@" + roleMention).queue(null, ErrorManager.PERMISSION);
					}
					DevelopmentMessages.broadcastUpdate(event, bChannel, null);
				}
			} else {
				Member discordOwner = guild.getOwner();
				if (discordOwner != null) {
					discordOwner.getUser().openPrivateChannel().queue(result -> DevelopmentMessages.broadcastUpdate(event, null, result));
				} else {
					List<Member> admins = guild.getMembers();
					admins.removeIf(member -> !member.hasPermission(Permission.ADMINISTRATOR));
					for (Member admin : admins) {
						if (admin != null) {
							admin.getUser().openPrivateChannel().queue(result -> DevelopmentMessages.broadcastUpdate(event, null, result));
							break;
						}
					}
				}
			}


		}

	}



}
