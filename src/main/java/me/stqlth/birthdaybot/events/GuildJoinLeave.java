package me.stqlth.birthdaybot.events;

import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.debug.DebugMessages;
import me.stqlth.birthdaybot.utils.Logger;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.events.guild.GuildJoinEvent;
import net.dv8tion.jda.api.events.guild.GuildLeaveEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;

import java.sql.*;


public class GuildJoinLeave extends ListenerAdapter {
    private BirthdayBotConfig birthdayBotConfig;
    private DebugMessages debugMessages;

    public GuildJoinLeave(BirthdayBotConfig birthdayBotConfig, DebugMessages debugMessages) {
        this.birthdayBotConfig = birthdayBotConfig;
        this.debugMessages = debugMessages;
    }

    public void onGuildJoin(GuildJoinEvent event) {
        Guild guild = event.getGuild();
        Logger.Info("Guild \"" + guild.getName() + "\" (" + guild.getId() + ") joined!");

        try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {

            ResultSet check = statement.executeQuery("CALL DoesGuildAlreadyExist(" + guild.getId() + ")");
            check.next();
            boolean alreadyExists = check.getBoolean("AlreadyExists");

            if (!alreadyExists) {
                statement.execute("CALL InsertGuildSettings('bday ')");
                ResultSet rs = statement.executeQuery("CALL SelectLastInsertID()");
                rs.next();
                int lastId = rs.getInt("LAST_INSERT_ID()");
                statement.execute("CALL InsertGuild(" + guild.getId() + ", " + lastId + ", 1)");
            } else {
                statement.execute("CALL UpdateGuildActive(" + guild.getId() + ", 1)");
            }

        } catch (SQLException ex) {
            debugMessages.sqlDebug(ex);
        }

        for (Member mem : event.getGuild().getMembers()) {
            addUser(mem);
        }

    }

    public void onGuildLeave(GuildLeaveEvent event) {
        Guild g = event.getGuild();
        Logger.Info("Guild \"" + g.getName() + "\" (" + g.getId() + ") left!");

        try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {
            statement.execute("CALL UpdateGuildActive(" + g.getId() + ", 0)");
        } catch (SQLException ex) {
            debugMessages.sqlDebug(ex);
        }
    }

    private void addUser(Member member) {

        try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {

            ResultSet check = statement.executeQuery("CALL DoesUserAlreadyExist(" + member.getId() + ")");
            check.next();
            boolean UserAlreadyExists = check.getBoolean("AlreadyExists");

            if (!UserAlreadyExists) {
                statement.execute("CALL InsertUser(" + member.getId() + ")");
            }
        } catch (SQLException ex) {
            debugMessages.sqlDebug(ex);
        }
    }
}
