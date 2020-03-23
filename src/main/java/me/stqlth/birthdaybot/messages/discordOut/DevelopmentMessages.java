package me.stqlth.birthdaybot.messages.discordOut;

import com.jagrosh.jdautilities.command.CommandEvent;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.PrivateChannel;
import net.dv8tion.jda.api.entities.SelfUser;
import net.dv8tion.jda.api.entities.TextChannel;

import javax.annotation.Nullable;
import java.awt.*;

public class DevelopmentMessages {

	public void broadcastUpdate(CommandEvent event, @Nullable TextChannel channel, @Nullable PrivateChannel privateChannel) {
		EmbedBuilder builder = new EmbedBuilder();
		SelfUser bot = event.getSelfUser();
		String botIcon = bot.getAvatarUrl();

		builder.setTitle("Major Update & Changes")
				.setColor(Color.GREEN)
				.setThumbnail(botIcon)
				.setAuthor("BirthdayBot", null, botIcon)
				.setDescription("Thank you for using BirthdayBot! As this bot was in beta there were bound to be some kinks and issues. " +
						"Unfortunately, recent updates and improvements have forced me to wipe user data, this will not happen again as the bot is moving out of beta " +
						"and into full release!")
				.addField("Update & Changes Which Caused the Data Reset", " - HEAVY Database Optimization" +
						"\n - Support for Leap Day Birthdays" +
						"\n - Abandoned GMT Offsets in favor of Specific Timezones, (Timezones give __more__ options and account for __daylight savings__)", false)
				.setFooter("If you have any questions/problems please join our support server with `bday support`", botIcon);
		if (channel != null) channel.sendMessage(builder.build()).queue(null, (error) ->{});
		else if (privateChannel != null) privateChannel.sendMessage(builder.build()).queue(null, (error) ->{});
	}

}
