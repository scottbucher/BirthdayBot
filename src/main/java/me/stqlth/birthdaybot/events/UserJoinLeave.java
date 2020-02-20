package me.stqlth.birthdaybot.events;

import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.debug.DebugMessages;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.User;
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
        addGuildUser(event);
    }

    public void onGuildMemberLeave(@NotNull GuildMemberLeaveEvent event) {
        deactivateGuildUser(event);
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
    private void addGuildUser(GuildMemberJoinEvent event) {

        try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {

            int userId = -1;
            userId = getUserId(event.getUser());
            int guildId = -1;
            guildId = getGuildId(event.getGuild());

            ResultSet check = statement.executeQuery("CALL DoesUserAlreadyExistInGuildUser(" + userId + ", " + guildId + ")");
            check.next();
            boolean UserAlreadyExists = check.getBoolean("AlreadyExists");

            if (!UserAlreadyExists) {
                statement.execute("CALL InsertGuildUser(" + userId + ", " + guildId + ")");
            } else {
                statement.execute("CALL UpdateGuildUserActive(" + userId + ", " + guildId + ", " + 1 + ")");
            }
        } catch (SQLException ex) {
            debugMessages.sqlDebug(ex);
        }
    }

    private void deactivateGuildUser(GuildMemberLeaveEvent event) {

        try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {

            int userId = -1;
            userId = getUserId(event.getUser());
            int guildId = -1;
            guildId = getGuildId(event.getGuild());

            statement.execute("CALL UpdateGuildUserActive(" + userId + ", " + guildId + ", " + 0 + ")");

        } catch (SQLException ex) {
            debugMessages.sqlDebug(ex);
        }
    }

    public int getUserId(User user) {
        try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {
            ResultSet rs = statement.executeQuery("CALL GetUserId(" + user.getId() + ")");
            rs.next();
            return rs.getInt("UserId");
        } catch (SQLException ex) {
            debugMessages.sqlDebug(ex);
        }
        return -1;
    }
    public int getGuildId(Guild guild) {
        try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {
            ResultSet rs = statement.executeQuery("CALL GetGuildId(" + guild.getId() + ")");
            rs.next();
            return rs.getInt("GuildId");
        } catch (SQLException ex) {
            debugMessages.sqlDebug(ex);
        }
        return -1;
    }

}
