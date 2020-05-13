package me.stqlth.birthdaybot.events;

import jdk.nashorn.internal.runtime.ECMAException;
import me.stqlth.birthdaybot.utils.ErrorManager;
import me.stqlth.birthdaybot.utils.Utilities;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.SelfUser;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.exceptions.PermissionException;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import org.jetbrains.annotations.NotNull;

import java.awt.*;
import java.util.Arrays;
import java.util.List;

public class MessageReceived extends ListenerAdapter {

	public void onMessageReceived(@NotNull MessageReceivedEvent event) {

		if (!Utilities.isPrivate(event) && !event.getGuild().getSelfMember().hasPermission(Permission.MESSAGE_WRITE)) return;

		boolean normal = event.isFromGuild();

		String[] args = event.getMessage().getContentRaw().split(" ");

		String prefix = args[0].toLowerCase();
		if (!prefix.equals("bday")) {
			return;
		}

		if (args.length < 2) {
			sendHelpMessage(event, normal);
			return;
		}

		String cmd = args[1].toLowerCase();

		List<String> validCmds = Arrays.asList(
				"help",
				"about",
				"serverinfo",
				"settings",
				"shard",
				"setup",
				"set",
				"clear",
				"viewsets",
				"setattempts",
				"config",
				"setbirthdaychannel",
				"setbirthdayrole",
				"settrustedrole",
				"createbirthdaychannel",
				"createbirthdayrole",
				"createtrustedrole",
				"clearbirthdaychannel",
				"clearbirthdayrole",
				"cleartrustedrole",
				"next",
				"view",
				"invite",
				"support",
				"testmessage"
		);

		if(validCmds.contains(cmd)) {
			return;
		}

		sendHelpMessage(event, normal);
	}

	public static void sendHelpMessage(MessageReceivedEvent event, boolean normal) {
		SelfUser bot = event.getJDA().getSelfUser();
		String botIcon = bot.getAvatarUrl();
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor("BirthdayBot General Help", null, botIcon)
				.setDescription("Birthday Bot handles user's birthdays and allows for a wide variety of settings and customizability for server owners. " +
						"If you have any questions or run into any problems please join our support server [here](https://discord.gg/9gUQFtz)" +
						"\n" +
						"\n**bday set** - Set your birthday information." +
						"\n**bday clear** - Clear your data from the Birthday Bot database." +
						"\n**bday viewSets** - View how many birthday sets you have left." +
						"\n**bday view <user>** - View another person's birthday." +
						"\n**bday next** - View the next birthday in a server." +
						"\n**bday invite** -  Get the BirthdayBot invite link." +
						"\n**bday support** - Join the BirthdayBot support server" +
						"\n**bday help setup** - View more help regarding server setup." +
						"\n**bday help setup optional** - View help on optional server settings.");
		try {
			if (normal) event.getTextChannel().sendMessage(builder.build()).queue(null, ErrorManager.GENERAL);
			else event.getPrivateChannel().sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
		} catch (PermissionException ignored) {}


	}
}
