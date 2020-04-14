package me.stqlth.birthdaybot.events;

import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.debug.DebugMessages;
import me.stqlth.birthdaybot.utils.ErrorManager;
import me.stqlth.birthdaybot.utils.Logger;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.events.guild.GuildJoinEvent;
import net.dv8tion.jda.api.events.guild.GuildLeaveEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;

import java.awt.*;
import java.sql.*;
import java.util.Objects;


public class GuildJoinLeave extends ListenerAdapter {

    public void onGuildJoin(GuildJoinEvent event) {
        Guild g = event.getGuild();
        Logger.Info("Registering Guild: \"" + g.getName() + "\" (" + g.getId() + ")!");

        try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {

            ResultSet check = statement.executeQuery("CALL DoesGuildAlreadyExist(" + g.getId() + ")");
            check.next();
            boolean alreadyExists = check.getBoolean("AlreadyExists");

            if (!alreadyExists) {
                statement.execute("CALL InsertGuildSettings('bday ')");
                ResultSet rs = statement.executeQuery("CALL SelectLastInsertID()");
                rs.next();
                int lastId = rs.getInt("LAST_INSERT_ID()");
                statement.execute("CALL InsertGuild(" + g.getId() + ", " + lastId + ", 1)");
            } else {
                statement.execute("CALL UpdateGuildActive(" + g.getId() + ", 1)");
            }
        } catch (SQLException ex) {
            DebugMessages.sqlDebug(ex);
            return;
        }

        Logger.Info("Registered Guild: \"" + g.getName() + "\" (" + g.getId() + ")!");
        sendBotInfo(event);
    }

    public void onGuildLeave(GuildLeaveEvent event) {
        Guild g = event.getGuild();
        Logger.Info("UnRegistering Guild \"" + g.getName() + "\" (" + g.getId() + ")!");

        try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {
            statement.execute("CALL UpdateGuildActive(" + g.getId() + ", 0)");

        } catch (SQLException ex) {
            DebugMessages.sqlDebug(ex);
        }
        Logger.Info("UnRegistered Guild \"" + g.getName() + "\" (" + g.getId() + ")!");
    }

    private void sendBotInfo(GuildJoinEvent event) {
        User target = Objects.requireNonNull(event.getGuild().getOwner()).getUser();

        EmbedBuilder builder = new EmbedBuilder();

        builder.setColor(Color.decode("#1CFE86"))
                .setAuthor(event.getGuild().getName(), null, event.getGuild().getIconUrl())
                .setTitle("**Thank you for using BirthdayBot**")
                .setDescription("" +
                        "\n » To view the commands of this bot use `bday help`" +
                        "\n" +
                        "\nTo setup your bot in your server use the `bday setup` to setup the essential aspects of the bot." +
                        "\nTo setup optional settings use `bday setup optional`")
                .setFooter("Join our support server for help!", event.getJDA().getSelfUser().getAvatarUrl())
                .setThumbnail(event.getJDA().getSelfUser().getAvatarUrl());
        target.openPrivateChannel().queue(result -> {
            result.sendMessage(builder.build()).queue(null, ErrorManager.PRIVATE);
        });

    }
}
