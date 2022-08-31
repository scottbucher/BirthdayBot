package me.stqlth.birthdaybot.events;

import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.events.guild.member.GuildMemberJoinEvent;
import net.dv8tion.jda.api.events.guild.member.GuildMemberLeaveEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import org.jetbrains.annotations.NotNull;

public class UserJoinLeave extends ListenerAdapter {
	DatabaseMethods db;

	public UserJoinLeave(DatabaseMethods databaseMethods) {
		this.db = databaseMethods;
	}

	public void onGuildMemberJoin(@NotNull GuildMemberJoinEvent event) {}

	public void onGuildMemberLeave(@NotNull GuildMemberLeaveEvent event) {}

}
