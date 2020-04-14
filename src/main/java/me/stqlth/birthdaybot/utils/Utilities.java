package me.stqlth.birthdaybot.utils;

import com.jagrosh.jdautilities.command.CommandEvent;
import com.mashape.unirest.http.Unirest;
import net.dv8tion.jda.api.entities.PrivateChannel;
import net.dv8tion.jda.api.entities.TextChannel;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.TimeUnit;

public class Utilities {

	public static void message(CommandEvent event, String message) {
		if (isPrivate(event)) event.getTextChannel().sendMessage(message).queue();
		else event.getPrivateChannel().sendMessage(message).queue();
	}

	public static boolean isLeap(int year) {
		//year = 1
		if (year % 4 == 0) {
			if (year % 100 == 0) {
				return year % 400 == 0;
			}
			return true;
		}
		return false;

	}

	public String formatTime(long timeInMillis) {
		final long hours = timeInMillis / TimeUnit.HOURS.toMillis(1);
		final long minutes = timeInMillis / TimeUnit.MINUTES.toMillis(1);
		final long seconds = timeInMillis % TimeUnit.MINUTES.toMillis(1) / TimeUnit.SECONDS.toMillis(1);

		return String.format("%01d:%02d:%02d", hours, minutes, seconds);
	}


	public static Color getAverageColor(String url) {
		if (url == null) {
			return new Color(27, 137, 255);
		}
		try {
			BufferedImage img = ImageIO.read(Unirest.get(url).asBinary().getRawBody());
			int x0 = 0;
			int y0 = 0;
			int x1 = x0 + img.getWidth();
			int y1 = y0 + img.getHeight();
			long sumr = 0, sumg = 0, sumb = 0;
			for (int x = x0; x < x1; x++) {
				for (int y = y0; y < y1; y++) {
					Color pixel = new Color(img.getRGB(x, y));
					sumr += pixel.getRed();
					sumg += pixel.getGreen();
					sumb += pixel.getBlue();
				}
			}
			int num = img.getWidth() * img.getHeight();
			return new Color((int) sumr / num, (int) sumg / num, (int) sumb / num);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return new Color(27, 137, 255);
	}

	public static boolean isPrivate(CommandEvent event) {
		TextChannel textChannel = null;
		PrivateChannel privateChannel = null;
		try {
			textChannel = event.getTextChannel();
		} catch (IllegalStateException ignored) {
			privateChannel = event.getPrivateChannel();
		}

		return (privateChannel != null);
	}

	public static long getMsToNextHour() {
		// Calculates the exact time of the next whole second
		LocalDateTime nextHour = LocalDateTime.now().plusHours(1).truncatedTo(ChronoUnit.HOURS);
		// Calculates the number of milliseconds until the next second
		return LocalDateTime.now().until(nextHour, ChronoUnit.MILLIS) + 500;
	}

	public static long getMsToNextMinute() {
		// Calculates the exact time of the next whole second
		LocalDateTime nextMinute = LocalDateTime.now().plusMinutes(1).truncatedTo(ChronoUnit.MINUTES);
		// Calculates the number of milliseconds until the next second
		return LocalDateTime.now().until(nextMinute, ChronoUnit.MILLIS);
	}
}
