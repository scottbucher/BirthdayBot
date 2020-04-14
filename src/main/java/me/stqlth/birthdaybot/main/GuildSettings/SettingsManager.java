package me.stqlth.birthdaybot.main.GuildSettings;

import com.jagrosh.jdautilities.command.GuildSettingsManager;
import com.jagrosh.jdautilities.command.GuildSettingsProvider;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import net.dv8tion.jda.api.entities.Guild;

public class SettingsManager implements GuildSettingsManager<GuildSettingsProvider> {
    @Override
    public GuildSettingsProvider getSettings(Guild guild) {
        return new Settings(guild);
    }

}
