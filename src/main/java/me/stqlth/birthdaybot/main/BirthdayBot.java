package me.stqlth.birthdaybot.main;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandClient;
import com.jagrosh.jdautilities.command.CommandClientBuilder;
import com.jagrosh.jdautilities.commons.waiter.EventWaiter;
import me.stqlth.birthdaybot.commands.developement.Broadcast;
import me.stqlth.birthdaybot.commands.staff.*;
import me.stqlth.birthdaybot.commands.user.*;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.events.GuildJoinLeave;
import me.stqlth.birthdaybot.events.MessageReceived;
import me.stqlth.birthdaybot.events.UserJoinLeave;
import me.stqlth.birthdaybot.main.GuildSettings.SettingsManager;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.Logger;
import me.stqlth.birthdaybot.utils.Utilities;
import net.dv8tion.jda.api.OnlineStatus;
import net.dv8tion.jda.api.entities.Activity;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.events.ReadyEvent;
import net.dv8tion.jda.api.hooks.EventListener;
import net.dv8tion.jda.api.sharding.DefaultShardManagerBuilder;
import net.dv8tion.jda.api.sharding.ShardManager;
import org.discordbots.api.client.DiscordBotListAPI;
import org.json.JSONObject;

import javax.security.auth.login.LoginException;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.util.List;
import java.util.concurrent.TimeUnit;

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

	private static void startBot() throws IOException {
		Logger.Info("Application started.");

		// Load config
		Logger.Info("Loading config...");
		loadConfig();

		// Construct dependencies
		EventWaiter waiter = new EventWaiter();

		SettingsManager settingsManager = new SettingsManager();
		DatabaseMethods databaseMethods = new DatabaseMethods();

		BirthdayTracker birthdayTracker = new BirthdayTracker(databaseMethods);
		Manager manager = new Manager();

		Command[] commands = new Command[]{
				//CONFIG
				new Setup(databaseMethods, waiter),
				new Config(databaseMethods),
				new SetBirthdayChannel(databaseMethods),
				new ClearBirthdayChannel(databaseMethods),
				new CreateBirthdayChannel(databaseMethods),
				new SetBirthdayRole(databaseMethods),
				new ClearBirthdayRole(databaseMethods),
				new CreateBirthdayRole(databaseMethods),
				new SetTrustedRole(databaseMethods),
				new ClearTrustedRole(databaseMethods),
				new CreateTrustedRole(databaseMethods),


				//INFO
				new Help(),
				new About(),
				new Settings(databaseMethods),
				new ServerInfo(),
				new Shard(),


				//UTILITIES
				new SetBday(waiter, databaseMethods),
				new Next(databaseMethods),
				new Support(),
				new Invite(),
				new View(databaseMethods),

				//Owner
				new Broadcast(databaseMethods)
		};

		// Create the client
		CommandClient client = createClient(settingsManager, commands);

		EventListener[] listeners = new EventListener[]{
				waiter,
				new GuildJoinLeave(),
				new UserJoinLeave(databaseMethods),
				new MessageReceived()
		};

		DiscordBotListAPI api = new DiscordBotListAPI.Builder()
				.token(BirthdayBotConfig.getBotListToken())
				.botId(BirthdayBotConfig.getBotId())
				.build();

		// Start the shard manager

		Logger.Info("Starting shard manager...");
		Logger.Info("Debug Mode: " + BirthdayBotConfig.isDebug());
		try {
			startShardManager(client, listeners);
			waiter.waitForEvent(ReadyEvent.class,
					e -> e.getGuildAvailableCount() == e.getGuildTotalCount(),
					e -> {
						ShardManager shardManager = e.getJDA().getShardManager();
						Logger.Info("Bot Ready!");

						SetupDatabase(e.getJDA().getGuilds());
						Logger.Info("Database Ready!");

						manager.startScheduler(shardManager, api);
						Logger.Info("Api Manager Ready!");
						birthdayTracker.startTracker(shardManager);
					},
					5, TimeUnit.MINUTES, client::shutdown);
		} catch (Exception ex) {
			Logger.Error("Error encountered while logging in. The bot token may be incorrect.", ex);
			ex.printStackTrace();
		}



	}

	private static void loadConfig() throws IOException {
		Path configFilePath = new File(CONFIG_FILE).toPath();
		String configData = new String(Files.readAllBytes(configFilePath));
		JSONObject configJson = new JSONObject(configData);
		new BirthdayBotConfig(configJson);
	}

	private static CommandClient createClient(SettingsManager settingsManager, Command[] commands) {
		CommandClientBuilder clientBuilder = new CommandClientBuilder();
		clientBuilder.setGuildSettingsManager(settingsManager)
				.useDefaultGame()
				.useHelpBuilder(false)
				.setOwnerId(BirthdayBotConfig.getOwnerId())
				.setActivity(Activity.listening("Happy Birthday"))
				.setStatus(OnlineStatus.ONLINE)
				.setPrefix(BirthdayBotConfig.getPrefix())
				.setEmojis(SUCCESS_EMOJI, WARNING_EMOJI, ERROR_EMOJI)
				.addCommands(commands);
		return clientBuilder.build();
	}

	private static void startShardManager(CommandClient client, EventListener[] listeners) throws LoginException {
		DefaultShardManagerBuilder shardManager = new DefaultShardManagerBuilder();

		shardManager.setToken(BirthdayBotConfig.getToken())
				.addEventListeners((Object[]) listeners)
				.addEventListeners(client)
				.build();
	}

	private static void SetupDatabase(List<Guild> guildList) {
		for (Guild check : guildList) {
			if (!guildExists(check)) {
				AddGuildToDatabase(check);
			}
		}
	}

	private static boolean guildExists(Guild g) {
		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			ResultSet check = statement.executeQuery("CALL DoesGuildAlreadyExist(" + g.getId() + ")");
			check.next();
			boolean alreadyExists = check.getBoolean("AlreadyExists");

			if (alreadyExists) return true;

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
		return false;
	}

	private static void AddGuildToDatabase(Guild g) {

		try (Connection conn = DriverManager.getConnection(BirthdayBotConfig.getDbUrl(), BirthdayBotConfig.getDbUser(), BirthdayBotConfig.getDbPassword());
			 Statement statement = conn.createStatement()) {

			statement.execute("CALL InsertGuildSettings('bday ')");
			ResultSet rs = statement.executeQuery("CALL SelectLastInsertID()");
			rs.next();
			int lastId = rs.getInt("LAST_INSERT_ID()");
			statement.execute("CALL InsertGuild(" + g.getId() + ", " + lastId + ", 1)");

		} catch (SQLException ex) {
			Utilities.sqlDebug(ex);
		}
	}
}
