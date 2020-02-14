package me.stqlth.birthdaybot.main;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandClient;
import com.jagrosh.jdautilities.command.CommandClientBuilder;
import com.jagrosh.jdautilities.commons.waiter.EventWaiter;
import me.stqlth.birthdaybot.commands.staffCommands.*;
import me.stqlth.birthdaybot.commands.userCommands.*;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.events.GuildJoinLeave;
import me.stqlth.birthdaybot.events.GuildMessageRecieved;
import me.stqlth.birthdaybot.events.UserJoinLeave;
import me.stqlth.birthdaybot.main.GuildSettings.SettingsManager;
import me.stqlth.birthdaybot.messages.debug.DebugMessages;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.messages.discordOut.StaffMessages;
import me.stqlth.birthdaybot.messages.getMethods.GetMessageInfo;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.Logger;
import net.dv8tion.jda.api.OnlineStatus;
import net.dv8tion.jda.api.entities.Activity;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.hooks.EventListener;
import net.dv8tion.jda.api.sharding.DefaultShardManagerBuilder;
import net.dv8tion.jda.api.sharding.ShardManager;
import org.json.JSONObject;

import javax.security.auth.login.LoginException;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.util.List;

public class BirthdayBot {


    private static final String CONFIG_FILE = "botconfig.json";
    private static final String SUCCESS_EMOJI = "\uD83D\uDE03";
    private static final String WARNING_EMOJI = "\uD83D\uDE2E";
    private static final String ERROR_EMOJI = "\uD83D\uDE26";

    public static void main(String[] args) {
        try {
            startBot();
        } catch (IllegalArgumentException e) {
            Logger.Warn("No login details provided! Please provide a botToken in the config file.");
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void startBot() throws IOException, LoginException {
        Logger.Info("Application started.");

        // Load config
        Logger.Info("Loading config...");
        BirthdayBotConfig birthdayBotConfig = loadConfig();

        // Construct dependencies
        EventWaiter waiter = new EventWaiter();

        DebugMessages debugMessages = new DebugMessages();
        GetMessageInfo getMessageInfo = new GetMessageInfo(birthdayBotConfig, debugMessages);

        SettingsManager settingsManager = new SettingsManager(birthdayBotConfig, debugMessages);
        BirthdayMessages birthdayMessages = new BirthdayMessages(birthdayBotConfig, getMessageInfo);
        DatabaseMethods databaseMethods = new DatabaseMethods(birthdayBotConfig, debugMessages);
        StaffMessages staffMessages = new StaffMessages(birthdayBotConfig, getMessageInfo);

        BirthdayTracker birthdayTracker = new BirthdayTracker(databaseMethods, birthdayMessages, birthdayBotConfig);

        Command[] commands = new Command[]{
                //CONFIG
                new Config(databaseMethods, staffMessages),
                new SetChannel(databaseMethods, staffMessages),
                new ClearChannel(databaseMethods, staffMessages),
                new CreateChannel(databaseMethods, staffMessages),
                new SetBirthdayRole(databaseMethods, staffMessages),
                new ClearBirthdayRole(databaseMethods, staffMessages),
                new CreateBirthdayRole(databaseMethods, staffMessages),
                new SetTrustedRole(databaseMethods, staffMessages),
                new ClearTrustedRole(databaseMethods, staffMessages),
                new CreateTrustedRole(databaseMethods, staffMessages),
//                new SetMessage(databaseMethods, staffMessages),


                //INFO
                new Help(),
                new About(),
                new Settings(databaseMethods),
                new ServerInfo(),


                //UTILITIES
                new SetBDay(birthdayMessages, waiter, databaseMethods),
                new Next(databaseMethods, birthdayMessages),
                new Support(birthdayMessages),
                new Invite(birthdayMessages)
        };

        // Create the client
        CommandClient client = createClient(birthdayBotConfig, settingsManager, commands);

        EventListener[] listeners = new EventListener[]{
                waiter,
                new GuildJoinLeave(birthdayBotConfig, debugMessages),
                new UserJoinLeave(birthdayBotConfig, debugMessages),
                new GuildMessageRecieved(databaseMethods, birthdayMessages)
        };

        // Start the shard manager
        ShardManager instance;

        Logger.Info("Starting shard manager...");
        try {
            instance = startShardManager(birthdayBotConfig, client, listeners);
            try {
                Thread.sleep(5000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            birthdayTracker.startTracker(instance);
            SetupDatabase(birthdayBotConfig, instance.getGuilds(), debugMessages);
        } catch (Exception ex) {
            Logger.Error("Error encountered while logging in. The bot token may be incorrect.", ex);
        }


    }

    private static BirthdayBotConfig loadConfig() throws IOException {
        Path configFilePath = new File(CONFIG_FILE).toPath();
        String configData = new String(Files.readAllBytes(configFilePath));
        JSONObject configJson = new JSONObject(configData);
        return new BirthdayBotConfig(configJson);
    }

    private static CommandClient createClient(BirthdayBotConfig birthdayBotConfig, SettingsManager settingsManager, Command[] commands) {
        CommandClientBuilder clientBuilder = new CommandClientBuilder();
        clientBuilder.setGuildSettingsManager(settingsManager)
                .useDefaultGame()
                .useHelpBuilder(false)
                .setOwnerId(birthdayBotConfig.getOwnerId())
                .setActivity(Activity.listening("Happy Birthday"))
                .setStatus(OnlineStatus.ONLINE)
                .setPrefix(birthdayBotConfig.getPrefix())
                .setEmojis(SUCCESS_EMOJI, WARNING_EMOJI, ERROR_EMOJI)
                .addCommands(commands);
        return clientBuilder.build();
    }

    private static ShardManager startShardManager(BirthdayBotConfig birthdayBotConfig, CommandClient client, EventListener[] listeners) throws LoginException {
        DefaultShardManagerBuilder shardManager = new DefaultShardManagerBuilder();

        return shardManager.setToken(birthdayBotConfig.getToken())
                .addEventListeners((Object[]) listeners)
                .addEventListeners(client)
                .build();
    }

    private static void SetupDatabase(BirthdayBotConfig birthdayBotConfig, List<Guild> guildList, DebugMessages debugMessages) {
        for (Guild check : guildList) {
            if (!guildExists(birthdayBotConfig, debugMessages, check))
                AddGuildToDatabase(birthdayBotConfig, check, debugMessages);
            else {
                for (Member mCheck : check.getMembers()) {
                    if (!userExists(birthdayBotConfig, debugMessages, mCheck))
                        addUser(birthdayBotConfig, mCheck, debugMessages);
                }
            }
        }
    }

    private static boolean guildExists(BirthdayBotConfig birthdayBotConfig, DebugMessages debugMessages, Guild g) {
        try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {

            ResultSet check = statement.executeQuery("CALL DoesGuildAlreadyExist(" + g.getId() + ")");
            check.next();
            boolean alreadyExists = check.getBoolean("AlreadyExists");

            if (alreadyExists) return true;

        } catch (SQLException ex) {
            debugMessages.sqlDebug(ex);
        }
        return false;
    }

    private static boolean userExists(BirthdayBotConfig birthdayBotConfig, DebugMessages debugMessages, Member m) {
        try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {

            ResultSet check = statement.executeQuery("CALL DoesUserAlreadyExist(" + m.getId() + ")");
            check.next();
            boolean alreadyExists = check.getBoolean("AlreadyExists");

            if (alreadyExists) return true;

        } catch (SQLException ex) {
            debugMessages.sqlDebug(ex);
        }
        return false;
    }
    private static void AddGuildToDatabase(BirthdayBotConfig birthdayBotConfig, Guild g, DebugMessages debugMessages) {

        try (Connection conn = DriverManager.getConnection(birthdayBotConfig.getDbUrl(), birthdayBotConfig.getDbUser(), birthdayBotConfig.getDbPassword());
             Statement statement = conn.createStatement()) {

            statement.execute("CALL InsertGuildSettings('bday ')");
            ResultSet rs = statement.executeQuery("CALL SelectLastInsertID()");
            rs.next();
            int lastId = rs.getInt("LAST_INSERT_ID()");
            statement.execute("CALL InsertGuild(" + g.getId() + ", " + lastId + ", 1)");

        } catch (SQLException ex) {
            debugMessages.sqlDebug(ex);
        }

        for (Member mem : g.getMembers()) {
            addUser(birthdayBotConfig, mem, debugMessages);
        }

    }

    public static void addUser(BirthdayBotConfig birthdayBotConfig, Member member, DebugMessages debugMessages) {

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
