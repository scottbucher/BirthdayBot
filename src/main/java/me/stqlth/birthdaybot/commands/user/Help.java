package me.stqlth.birthdaybot.commands.user;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.utils.EmbedSender;
import me.stqlth.birthdaybot.utils.ErrorManager;
import me.stqlth.birthdaybot.utils.Utilities;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.*;

import java.awt.*;

public class Help extends Command {

	public Help() {
		this.name = "help";
		this.aliases = new String[]{"h", "?"};
		this.guildOnly = false;
		this.help = "Displays the help menu";
		this.category = new Category("Info");
		this.botPermissions = new Permission[]{Permission.MESSAGE_WRITE, Permission.MESSAGE_EMBED_LINKS};
	}

	@Override
	protected void execute(CommandEvent event) {
		boolean normal = !Utilities.isPrivate(event);

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

	public void sendHelpMessage(CommandEvent event, boolean normal) {
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
		if (normal) event.getTextChannel().sendMessage(builder.build()).queue(null, ErrorManager.GENERAL);
		else event.getPrivateChannel().sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
	}

	public void sendSetupHelpMessage(CommandEvent event, boolean normal) {
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
		if (normal) event.getTextChannel().sendMessage(builder.build()).queue(null, ErrorManager.GENERAL);
		else event.getPrivateChannel().sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
	}

	public  void sendOptionalSetupHelpMessage(CommandEvent event, boolean normal) {
		SelfUser bot = event.getJDA().getSelfUser();
		String botIcon = bot.getAvatarUrl();
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor("BirthdayBot Optional Setup Help", null, botIcon)
				.setDescription("" +
						"\n**bday setup optional** - Interactive guide for optional server setup settings." +
						"\n" +
						"\n**bday createTrustedRole** - Create the default trusted role." +
						"\n**bday setTrustedRole** - Set custom trusted role." +
						"\n**bday clearTrustedRole** - Clear the trusted role from the database." +
						"\n\n**bday config message setMention <everyone/here/@role/rolename/disable>** - What group should the bot @ in the birthday message." +
						"\n\n**bday config message setTime <0-23>** - What time should the bot send the birthday message." +
						"\n\n**bday config message set <Message>** - Set custom birthday message. Use @Users in your message, it will be replaced with the birthdays." +
						"\n**Example Usage**: `bday config message set Happy Birthday @Users!`" +
						"\n\n**bday config message reset** - Reset the birthday message." +
						"\n\n**bday config message useEmbed <true/false>** - Should the Birthday Message be embedded? (Set false for links/images to work properly)" +
						"\n\n**bday config trusted preventRole <true/false>** - Set if you need the trusted role to get the Birthday Role." +
						"\n\n**bday config trusted preventMessage <true/false>** - Set if you need the trusted role to get the Birthday Message.");
		if (normal) event.getTextChannel().sendMessage(builder.build()).queue(null, ErrorManager.GENERAL);
		else event.getPrivateChannel().sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
	}
}