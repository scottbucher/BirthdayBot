package me.stqlth.birthdaybot.events;

import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.debug.DebugMessages;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.events.guild.member.GuildMemberJoinEvent;
import net.dv8tion.jda.api.events.guild.member.GuildMemberLeaveEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import org.jetbrains.annotations.NotNull;

import java.sql.*;

public class UserJoinLeave extends ListenerAdapter {

    private BirthdayBotConfig birthdayBotConfig;
    private DebugMessages debugMessages;

    public UserJoinLeave(BirthdayBotConfig birthdayBotConfig, DebugMessages debugMessages) {
        this.birthdayBotConfig = birthdayBotConfig;
        this.debugMessages = debugMessages;
    }

    public void onGuildMemberJoin(@NotNull GuildMemberJoinEvent event) {
        addUser(event);
    }

    public void onGuildMemberLeave(@NotNull GuildMemberLeaveEvent event) {

    }
    private void addUser(GuildMemberJoinEvent event) {

        try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {

            ResultSet check = statement.executeQuery("CALL DoesUserAlreadyExist(" + event.getMember().getId() + ")");
            check.next();
            boolean UserAlreadyExists = check.getBoolean("AlreadyExists");

            if (!UserAlreadyExists) {
                statement.execute("CALL InsertUser(" + event.getMember().getId() + ")");
            }
        } catch (SQLException ex) {
            debugMessages.sqlDebug(ex);
        }
    }
}
