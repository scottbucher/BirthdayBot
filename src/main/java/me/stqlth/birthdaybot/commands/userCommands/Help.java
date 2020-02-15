package me.stqlth.birthdaybot.commands.userCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.*;

import java.awt.*;

public class Help extends Command {

	public Help() {
		this.name = "help";
		this.aliases = new String[]{"h", "?"};
		this.guildOnly = true;
		this.help = "Displays the help menu";
		this.category = new Category("Info");
	}

	@Override
	protected void execute(CommandEvent event) {
		TextChannel channel = event.getTextChannel();
		String[] args = event.getMessage().getContentRaw().split(" ");

		if (args.length == 2) {
			sendHelpMessage(event, channel);
			return;
		}
		if (args[2].equalsIgnoreCase("setup")) {
			sendSetupHelpMessage(event, channel);
		} else if (args[2].equalsIgnoreCase("config")) {
			sendConfigHelpMessage(event, channel);
		}

	}

	public void sendHelpMessage(CommandEvent event, TextChannel channel) {
		SelfUser bot = event.getJDA().getSelfUser();
		String botIcon = bot.getAvatarUrl();
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor("BirthdayBot General Help", null, botIcon)
				.addField("bday set <day>, <month>, <year>, <gmt offset>", "This command enters your birthday into our system. " +
						"Each User may use this command up to __**3**__ times. This is to prevent abuse.\n\n" +
						"If you don't know what a GMT offset is, click [here](https://www.timeanddate.com/time/map/) and hover over your location on the map. " +
						"Your GMT offset is the value at the bottom that is highlighted " +
						"(if the highlighted value at the bottom simply says `UTC`, then your GMT offset is 0.).\n\n" +
						"Example usage: `bday set 28, 8, 2001, -5`\n ", false)
				.addField("bday <@user>", "View a player's birthday", false)
				.addField("bday next", "View the next birthday in your guild", false)
				.addField("bday invite", "Invites the bot to your server", false)
				.addField("bday support", "Join the BirthdayBot support discord", false)
				.addField("More Help Options", "Use `bday help setup` for help with the bot setup!\n" +
						"Use `bday help config` for help with bot configuration!", false);
		channel.sendMessage(builder.build()).queue();
	}
	public void sendConfigHelpMessage(CommandEvent event, TextChannel channel) {
		SelfUser bot = event.getJDA().getSelfUser();
		String botIcon = bot.getAvatarUrl();
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor("BirthdayBot Config Help", null, botIcon)
				.addField("Trusted Config", "These commands allow server owners to define what the trusted role prevents/allows. " +
						"For these settings to work, a trusted role must be set, to set this up, use `bday help setup`.\n\n**NOTE:** All settings have a default value of **true**!" +
						"\n\n`bday config trusted preventMessage <true/false>`\n - When **true** users without the trusted role will not receive a birthday message." +
						"\n\n`bday config trusted preventRole <true/false>`\n - When **true** users without the trusted role will not receive a birthday role.", false)
				.addField("Mention Setting", "These commands allow server owners to define what role/group BirthdayBot should mention when a birthday happens. " +
						"For these settings to work, a birthday channel must be set, to set this up, use `bday help setup`.\n\n**NOTE:** By default all servers have mentions **disabled**!" +
						"\n\n`bday config mentionSetting <everyone/here/@role/rolename/disable>`" +
						"\n - When set to **everyone** the bot @everyone when a birthday message is sent." +
						"\n - When set to **here** the bot will @here when a birthday message is sent." +
						"\n - When set to a **role** the bot will mention that role when a birthday message is sent." +
						"\n - When set to **disabled** the bot will not send a mention with birthday messages.", false)
				.addField("Message Setting", "These commands allow server owners to change settings for the birthday message " +
				"For these settings to work, a birthday channel must be set, to set this up, use `bday help setup`." +
				"\n\n`bday config messageTime <0-23>`" +
				"\n - The 0-23 represents hours in military time. EX: 0 = 12am (The start of the day) while 23 = 11pm" +
				"\n\n`bday config setMessage <Message>`" +
				"\nUse `@Users` in your message if you want the message to include the user(s) who's birthday it is." +
				" `@Users` auto formats the names as such: `Stqlth, User2, and User 3` if there were 3 birthdays that day" +
						"\n\n`bday config resetMessage`\n" +
						" - Sets the birthday message to its default value.", false);
		channel.sendMessage(builder.build()).queue();
	}
	public void sendSetupHelpMessage(CommandEvent event, TextChannel channel) {
		SelfUser bot = event.getJDA().getSelfUser();
		String botIcon = bot.getAvatarUrl();
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor("BirthdayBot Setup Help", null, botIcon)
				.addField("Birthday Role", "The birthday role is the role given to users on their birthday. " +
						"When a birthday role is not set, users do not receive a birthday role, regardless of other settings." +
						"\n\n`bday SetBirthdayRole <@role/rolename>`\n`bday CreateBirthdayRole` - Creates the default birthday role\n`bday ClearBirthdayRole` - Clears the birthday role\n\n", false)
				.addField("Birthday Channel", "The birthday channel is the channel birthday messages are sent in. " +
						"When a birthday channel is not set birthday messages are not set, regardless of other settings." +
						"\n\n`bday SetChannel <@role/rolename>`\n`bday CreateChannel` - Creates the default birthday channel\n`bday ClearChannel` - Clears the birthday channel", false)
				.addField("Trusted Role", "The trusted role is the role which allows users to receive the birthday role and/or birthday message. " +
						"When a trusted role is not set, all users receive a birthday role and/or message assuming the birthday role and/or channel are set." +
						"\n\n`bday SetTrustedRole <@role/rolename>`\n`bday CreateTrustedRole` - Creates the default trusted role\n`bday ClearTrustedRole` - Clears the trusted role", false);
		channel.sendMessage(builder.build()).queue();
	}
}
