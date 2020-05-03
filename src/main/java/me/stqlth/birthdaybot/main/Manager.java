package me.stqlth.birthdaybot.main;

import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.utils.Logger;
import me.stqlth.birthdaybot.utils.Utilities;
import net.dv8tion.jda.api.entities.Activity;
import net.dv8tion.jda.api.sharding.ShardManager;
import org.discordbots.api.client.DiscordBotListAPI;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class Manager {

	public void startScheduler(ShardManager client, DiscordBotListAPI api) {
		Logger.Info("Starting Manager Scheduler...");
		int everyMinute = 1000 * 60; //for testing
		int everyHour = 1000 * 60 * 60; //actual amount

		ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

		// Create a new schedule
		scheduler.scheduleAtFixedRate(
				// Method to call on a schedule
				() -> {
					startManager(client, api);
				},
				// How long to wait before starting, in ms
				// Calculates the time to the next exact Hour:
				Utilities.getMsToNextMinute() + (4 * 60000),
				// Once started, how often to repeat, in ms
				everyMinute * 5,
				// The unit of time for the above parameters
				TimeUnit.MILLISECONDS);
	}

	private void startManager(ShardManager client, DiscordBotListAPI api) {
		try {
			int serverCount = client.getGuilds().size();
			Logger.Debug("Updating Manager with ServerCount: " + serverCount);
			if (BirthdayBotConfig.updateApi()) api.setStats(serverCount);
			client.setActivity(Activity.streaming("bdays to " + serverCount + " servers", "https://www.twitch.tv/stqlth"));
		} catch (Exception ex) {
			Logger.Error("The Manager Caught an Exception.", ex);
		}
	}

}
