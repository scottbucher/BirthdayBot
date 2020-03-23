package me.stqlth.birthdaybot.commands.developement;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.discordOut.DevelopmentMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.*;

import java.util.List;

public class Broadcast extends Command {

	private DatabaseMethods db;
	private DevelopmentMessages developementMessages;

	public Broadcast(DatabaseMethods databaseMethods, DevelopmentMessages developementMessages) {
		this.name = "broadcast";
		this.guildOnly = true;
		this.hidden = true;
		this.ownerCommand = true;

		this.db = databaseMethods;
		this.developementMessages = developementMessages;
	}

	@Override
	protected void execute(CommandEvent event) {
		List<Guild> guilds = event.getJDA().getGuilds();

		for (Guild guild : guilds) {
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
						if (mRole != null) bChannel.sendMessage(mRole.getAsMention()).queue(null, (error) -> {});
						else bChannel.sendMessage("@" + roleMention).queue(null, (error) -> {});
					}
					developementMessages.broadcastUpdate(event, bChannel, null);
					return;
				}
			}
			Member discordOwner = guild.getOwner();
			if (discordOwner != null) {
				discordOwner.getUser().openPrivateChannel().queue(result -> developementMessages.broadcastUpdate(event, null, result));
				return;
			}

			List<Member> admins = guild.getMembers();
			admins.removeIf(member -> !member.hasPermission(Permission.ADMINISTRATOR));
			for (Member admin : admins) {
				if (admin != null) {
					admin.getUser().openPrivateChannel().queue(result -> developementMessages.broadcastUpdate(event, null, result));
					return;
				}
			}
		}

	}



}
