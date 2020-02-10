package me.stqlth.birthdaybot.main.GuildSettings;

import com.jagrosh.jdautilities.command.GuildSettingsProvider;
import me.stqlth.birthdaybot.commands.userCommands.Help;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.debug.DebugMessages;
import net.dv8tion.jda.api.entities.Guild;

import java.sql.*;
import java.util.Collection;
import java.util.LinkedList;

public class Settings implements GuildSettingsProvider {

    private final Guild guild;
    private Collection<String> prefixes;
    private BirthdayBotConfig birthdayBotConfig;
    private DebugMessages debugMessages;

    public Settings(Guild guild, BirthdayBotConfig birthdayBotConfig, DebugMessages debugMessages) {
        this.guild = guild;
        this.prefixes = new LinkedList<>();
        this.birthdayBotConfig = birthdayBotConfig;
        this.debugMessages = debugMessages;
    }

    @Override
    public Collection<String> getPrefixes() {


        try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {
            int gSettingsId=0;

            ResultSet id = statement.executeQuery("CALL GetGuildSettingsId(" + guild.getId() + ")");
            if (id.next()) gSettingsId = id.getInt("GuildSettingsId");

            ResultSet rs = statement.executeQuery("CALL GetPrefix(" + gSettingsId + ")");

            if (rs.next()) {
                prefixes.add(rs.getString("Prefix"));
            }


        } catch (SQLException ex) {
            debugMessages.sqlDebug(ex);
        }
        return prefixes;
    }
}
