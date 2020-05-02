package me.stqlth.birthdaybot.utils;

import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.Message;
import net.dv8tion.jda.api.entities.PrivateChannel;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.exceptions.PermissionException;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import java.awt.*;

public class EmbedSender {

	public static void sendEmbed(@Nonnull TextChannel channel, @Nullable String title, @Nonnull String description, @Nullable Color color) {
		try {
		EmbedBuilder builder = new EmbedBuilder();
		if (color == null) color = Color.decode("#5AE8FF"); //Default color
		builder.setDescription(description)
				.setColor(color);
		if (title != null) builder.setTitle(title);
			channel.sendMessage(builder.build()).queue(null, error -> {
				if (!(error instanceof PermissionException)) {
					Logger.Error("Failed to send message to a TextChannel with ID: " + channel.getId(), error);
				}
			});
		} catch (Exception ignored) {}

	}
	public static void sendEmbed(@Nonnull PrivateChannel channel, @Nullable String title, @Nonnull String description, @Nullable Color color) {
		try {
		EmbedBuilder builder = new EmbedBuilder();
		if (color == null) color = Color.decode("#5AE8FF"); //Default color
		builder.setDescription(description)
				.setColor(color);
		if (title != null) builder.setTitle(title);
			channel.sendMessage(builder.build()).queue(null, error -> {
				if (!(error instanceof UnsupportedOperationException)) {
					Logger.Error("Failed to send message to a TextChannel with ID: " + channel.getId(), error);
				}
			});
		} catch (Exception ignored){}

	}

//	public static Message sendEmbedWithResult(@Nonnull TextChannel channel, @Nullable String title, @Nonnull String description, @Nullable Color color) {
//		EmbedBuilder builder = new EmbedBuilder();
//		if (color == null) color = Color.decode("#5AE8FF"); //Default color
//		builder.setDescription(description)
//				.setColor(color);
//		if (title != null) builder.setTitle(title);
//
//
//		channel.sendMessage(builder.build()).queue(result -> {
//			return result;
//		}, error -> {
//			if (!(error instanceof PermissionException)) {
//				Logger.Error("Failed to send message to a TextChannel with ID: " + channel.getId(), error);
//			}
//			return null;
//		});
//
//
//		return null;
//	}
}
