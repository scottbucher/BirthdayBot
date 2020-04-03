package me.stqlth.birthdaybot.events;

import me.stqlth.birthdaybot.utils.ErrorManager;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.SelfUser;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import org.jetbrains.annotations.NotNull;

import java.awt.*;

public class MessageRecieved extends ListenerAdapter {

	public void onMessageReceived(@NotNull MessageReceivedEvent event) {
		boolean normal = event.isFromGuild();

		String[] args = event.getMessage().getContentRaw().split(" ");

		if (args.length == 2) {
			sendHelpMessage(event, normal);
			return;
		}
		if (args[2].equalsIgnoreCase("setup")) {
			if (args.length == 4) {
				if (args[3].equalsIgnoreCase("optional")) sendOptionalSetupHelpMessage(event, normal);
			} else sendSetupHelpMessage(event, normal);
		}
	}

	public static void sendHelpMessage(MessageReceivedEvent event, boolean normal) {
		SelfUser bot = event.getJDA().getSelfUser();
		String botIcon = bot.getAvatarUrl();
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor("BirthdayBot General Help", null, botIcon)
				.setDescription("Birthday Bot handles user's birthdays and allows for a wide variety of settings and customizability for server owners. " +
						"If you have any questions or run into any problems please join our support server [here](https://discord.gg/24xS3N5)" +
						"\n" +
						"\n**bday set** - Set your birthday information." +
						"\n**bday view <user>** - View another person's birthday." +
						"\n**bday next** - View the next birthday in a server." +
						"\n**bday invite** -  Get the BirthdayBot invite link." +
						"\n**bday support** - Join the BirthdayBot support server" +
						"\n**bday help setup** - View more help regarding server setup." +
						"\n**bday help setup optional** - View help on optional server settings.");
		if (normal) event.getTextChannel().sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
		else event.getPrivateChannel().sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
	}

	public static void sendSetupHelpMessage(MessageReceivedEvent event, boolean normal) {
		SelfUser bot = event.getJDA().getSelfUser();
		String botIcon = bot.getAvatarUrl();
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor("BirthdayBot Setup Help", null, botIcon)
				.setDescription("" +
						"\n**bday setup** - Interactive guide for server setup." +
						"\n" +
						"\n**bday createBirthdayRole** - Create the default birthday role." +
						"\n**bday createBirthdayChannel** - Create the default birthday channel." +
						"\n**bday setBirthdayRole** - Set custom birthday role." +
						"\n**bday setBirthdayChannel** - Set custom birthday channel." +
						"\n**bday clearBirthdayRole** - Clear the birthday role from the database." +
						"\n**bday clearBirthdayChannel** - Clear the birthday channel from the database.");
		if (normal) event.getTextChannel().sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
		else event.getPrivateChannel().sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
	}

	public static void sendOptionalSetupHelpMessage(MessageReceivedEvent event, boolean normal) {
		SelfUser bot = event.getJDA().getSelfUser();
		String botIcon = bot.getAvatarUrl();
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor("BirthdayBot Optional Setup Help", null, botIcon)
				.setDescription("" +
						"\n**bday setup optional** - Interactive guide for optional server setup settings." +
						"\n" +
						"\n\n**bday config mentionSetting <everyone/here/@role/rolename/disable>** - What group should the bot @ in the birthday message." +
						"\n\n**bday config messageTime <0-23>** - What time should the bot send the birthday message." +
						"\n\n**bday config setMessage <Message>** - Set custom birthday message." +
						"\n\n**bday config resetMessage** - Reset the birthday message." +
						"\n\n**bday config trusted preventRole <true/false>** - Set if you need the trusted role to get the Birthday Role." +
						"\n\n**bday config trusted preventMessage <true/false>** - Set if you need the trusted role to get the Birthday Message.");
		if (normal) event.getTextChannel().sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);
		else event.getPrivateChannel().sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
	}

}
