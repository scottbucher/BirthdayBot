package me.stqlth.birthdaybot.main.GuildSettings;

import com.jagrosh.jdautilities.command.GuildSettingsProvider;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.utils.Utilities;
import net.dv8tion.jda.api.entities.Guild;

import java.sql.*;
import java.util.Collection;
import java.util.LinkedList;

public class Settings implements GuildSettingsProvider {

    private final Guild guild;
    private Collection<String> prefixes;

    public Settings(Guild guild) {
        this.guild = guild;
        this.prefixes = new LinkedList<>();
    }

    @Override
    public Collection<String> getPrefixes() {


        try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {
            int gSettingsId=0;

            ResultSet id = statement.executeQuery("CALL GetGuildSettingsId(" + guild.getId() + ")");
            if (id.next()) gSettingsId = id.getInt("GuildSettingsId");

            ResultSet rs = statement.executeQuery("CALL GetPrefix(" + gSettingsId + ")");

            if (rs.next()) {
                prefixes.add(rs.getString("Prefix"));
            }


        } catch (SQLException ex) {
            Utilities.sqlDebug(ex);
        }
        return prefixes;
    }
}
