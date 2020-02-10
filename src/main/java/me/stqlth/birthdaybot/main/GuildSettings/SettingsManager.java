package me.stqlth.birthdaybot.main.GuildSettings;

import com.jagrosh.jdautilities.command.GuildSettingsManager;
import com.jagrosh.jdautilities.command.GuildSettingsProvider;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.debug.DebugMessages;
import net.dv8tion.jda.api.entities.Guild;

public class SettingsManager implements GuildSettingsManager<GuildSettingsProvider> {

    private BirthdayBotConfig birthdayBotConfig;
    private DebugMessages debugMessages;

    public SettingsManager(BirthdayBotConfig birthdayBotConfig, DebugMessages debugMessages) {
        this.birthdayBotConfig = birthdayBotConfig;
        this.debugMessages = debugMessages;
    }

    @Override
    public GuildSettingsProvider getSettings(Guild guild) {
        return new me.stqlth.birthdaybot.main.GuildSettings.Settings(guild, birthdayBotConfig, debugMessages);
    }

}
