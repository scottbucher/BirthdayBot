package me.stqlth.birthdaybot.commands.user;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.Utilities;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.SelfUser;
import net.dv8tion.jda.api.entities.TextChannel;

import java.util.Objects;

public class Settings extends Command {

	private DatabaseMethods db;

	public Settings(DatabaseMethods databaseMethods) {
		this.name = "settings";
		this.help = "View your server's current settings";
		this.guildOnly = true;
		this.hidden = true;

		this.db = databaseMethods;
	}


	@Override
	protected void execute(CommandEvent event) {
		TextChannel channel = event.getTextChannel();
		currentConfig(event, channel);
	}

	public void currentConfig(CommandEvent event, TextChannel channel) {
		EmbedBuilder builder = new EmbedBuilder();
		SelfUser bot = event.getJDA().getSelfUser();
		Guild guild = event.getGuild();

		long bdayChannel = db.getBirthdayChannel(event.getGuild());
		long bdayRole = db.getBirthdayRole(event.getGuild());
		long trustedRole = db.getTrustedRole(guild);
		int messageTime = db.getGuildMessageTime(event.getGuild());
		String mTime;
		if (messageTime >= 0 && messageTime <= 9) {
			mTime = "0" + messageTime + ":00";
		} else mTime = messageTime + ":00";

		String customMessage = db.getGuildBirthdayMessage(event.getGuild());
		if (customMessage.equalsIgnoreCase("0")) customMessage = "Default";
		String mentionSetting = db.getMentionSetting(event.getGuild());
		String bChannel = "Not Set";
		String bRole = "Not Set";
		String tRole = "Not Set";
		String mSetting = "Disabled";

		try {
			if (bdayChannel != 0) bChannel = Objects.requireNonNull(event.getGuild().getTextChannelById(bdayChannel)).getAsMention();
		} catch (Exception ex) {
			bChannel = "Not Set";
		}
		try {
		if (bdayRole != 0) bRole = Objects.requireNonNull(event.getGuild().getRoleById(bdayRole)).getAsMention();
		} catch (Exception ex) {
			bRole = "Not Set";
		}
		try {
		if (trustedRole != 0) tRole = Objects.requireNonNull(event.getGuild().getRoleById(trustedRole)).getAsMention();
		} catch (Exception ex) {
			tRole = "Not Set";
		}
		try {
			if (!mentionSetting.equals("0") && !mentionSetting.equalsIgnoreCase("everyone") && !mentionSetting.equalsIgnoreCase("here"))
				mSetting = Objects.requireNonNull(event.getGuild().getRoleById(mentionSetting)).getAsMention();
		} catch (Exception ex) {
			mSetting = "Disabled";
		}

		boolean preventMessages = db.getTrustedPreventMessage(guild);
		boolean preventRole = db.getTrustedPreventRole(guild);
		boolean preventAge = db.getPreventAge(guild);

		builder.setAuthor(guild.getName() + "'s Settings", null, guild.getIconUrl())
				.setColor(Utilities.getAverageColor(event.getMember().getUser().getAvatarUrl()))
				.addField("Birthday Channel", bChannel, true)
				.addField("Birthday Role", bRole, true)
				.addField("Trusted Role", tRole, true)
				.addField("Mention Setting", mSetting, true)
				.addField("Trusted Prevents Role", "" + preventRole, true)
				.addField("Trusted Prevents Message", "" + preventMessages, true)
				.addField("Message Time", "" + mTime, true)
				.addField("Custom Message", "" + customMessage, true)
				.addField("Show Members' Ages", "" + !preventAge, true)
//				.setThumbnail(bot.getAvatarUrl())
				.setFooter(bot.getName(), bot.getAvatarUrl());

		channel.sendMessage(builder.build()).queue(null, (error) -> {});
	}
}
