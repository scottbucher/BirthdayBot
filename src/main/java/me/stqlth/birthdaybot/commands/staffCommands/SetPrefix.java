package me.stqlth.birthdaybot.commands.staffCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.debug.DebugMessages;
import me.stqlth.birthdaybot.messages.discordOut.StaffMessages;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.TextChannel;

import java.sql.*;

public class SetPrefix extends Command {
    private BirthdayBotConfig birthdayBotConfig;
    private StaffMessages staffMessages;
    private DebugMessages debugMessages;

    public SetPrefix(BirthdayBotConfig birthdayBotConfig, StaffMessages staffMessages, DebugMessages debugMessages) {
        this.name = "setprefix";
        this.help = "Set the bot prefix.";
        this.guildOnly = true;
        this.hidden = true;
        this.birthdayBotConfig = birthdayBotConfig;
        this.staffMessages = staffMessages;
        this.debugMessages = debugMessages;
    }

    @Override
    protected void execute(CommandEvent event) {

        TextChannel channel = event.getTextChannel();

        String[] args = event.getMessage().getContentRaw().split(" ");
        Guild g = event.getGuild();
        Member sender = event.getMember();
        Permission req = Permission.ADMINISTRATOR;

        if (!sender.hasPermission(req)) {
            staffMessages.onlyAdmins(channel);
            return;
        }
        if (args.length != 2) {
            staffMessages.sendErrorMessagePrefix(channel, sender, event, getName());
            return;
        }

        if (args[1].length() > 100) {
            staffMessages.prefixTooLarge(channel);
            return;
        }

        try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {

            int gSettingsId=0;
            ResultSet id = statement.executeQuery("CALL GetGuildSettingsId(" + event.getGuild().getId() + ")");
            if (id.next()) gSettingsId = id.getInt("GuildSettingsId");

            statement.execute("CALL UpdatePrefix('" + args[1] + "', " + gSettingsId + ")");
            staffMessages.setPrefix(channel, args[1]);
        } catch (SQLException ex) {
            debugMessages.sqlDebug(ex);
        }


    }
}