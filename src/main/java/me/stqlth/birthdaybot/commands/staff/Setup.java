package me.stqlth.birthdaybot.commands.staff;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import com.jagrosh.jdautilities.commons.waiter.EventWaiter;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.ErrorManager;
import me.stqlth.birthdaybot.utils.EmbedSender;
import me.stqlth.birthdaybot.utils.Logger;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.events.message.react.MessageReactionAddEvent;
import net.dv8tion.jda.api.exceptions.PermissionException;

import java.awt.*;
import java.util.EnumSet;
import java.util.Objects;
import java.util.concurrent.TimeUnit;


public class Setup extends Command {

	private EventWaiter waiter;
	private DatabaseMethods db;
	private static final String CREATE_EMOJI = "\uD83D\uDD28";
	private static final String SELECT_EMOJI = "\uD83D\uDDB1";
	private static final String NO_EMOJI = "\u274C";
	private static final String YES_EMOJI = "\u2705";

	public Setup(DatabaseMethods databaseMethods, EventWaiter waiter) {
		this.name = "setup";
		this.guildOnly = true;
		this.help = "Setup a Guild's server settings";
		this.botPermissions = new Permission[]{Permission.MESSAGE_HISTORY, Permission.MESSAGE_WRITE, Permission.MESSAGE_EMBED_LINKS, Permission.MANAGE_CHANNEL, Permission.MANAGE_ROLES, Permission.MESSAGE_ADD_REACTION, Permission.MESSAGE_MANAGE};

		this.db = databaseMethods;
		this.waiter = waiter;
	}

	@Override
	protected void execute(CommandEvent event) {
		Permission req = Permission.ADMINISTRATOR;
		TextChannel channel = event.getTextChannel();
		Member member = event.getMember();
		if (!member.hasPermission(req)) {
			String message = "Only Admins may use this command!";
			EmbedSender.sendEmbed(channel, null, message, Color.RED);
			return;
		}

		String[] args = event.getMessage().getContentRaw().split(" ");

		if (args.length == 2) {
			getChannel(event, member);
		} else if (args[2].equalsIgnoreCase("optional")) {
			getBirthdayTime(event, member);
		}

	}

	public void getChannel(CommandEvent event, Member author) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getEffectiveName() + "#" + author.getUser().getDiscriminator(), null, author.getUser().getAvatarUrl())
				.setTitle("**Server Setup - Birthday Channel Selection**")
				.setDescription("" +
						"\n » To begin your setup you must set your birthday channel. This allows the bot to know where to send birthday messages!" +
						"\n" +
						"\nPlease select which option you would like")
				.addField("Create New Channel \uD83D\uDD28" +
						"\nSelect Pre-Existing Channel \uD83D\uDDB1" +
						"\nNo Birthday Channel \u274C", "", false)
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			result.addReaction(CREATE_EMOJI).queue(null, ErrorManager.GENERAL);
			result.addReaction(SELECT_EMOJI).queue(null, ErrorManager.GENERAL);
			result.addReaction(NO_EMOJI).queue(null, ErrorManager.GENERAL);
			waitForChannel(event, result, author);
		}, ErrorManager.GENERAL);


	}

	private void waitForChannel(CommandEvent event, Message result, Member member) {

		waiter.waitForEvent(MessageReactionAddEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember()) &&
						(e.getReactionEmote().getName().equals("\uD83D\uDD28") || e.getReactionEmote().getName().equals("\uD83D\uDDB1") || e.getReactionEmote().getName().equals("\u274C"))),
				e -> {

					if (!event.getSelfMember().hasPermission(Permission.MANAGE_CHANNEL)) {
						result.delete().queue(null, ErrorManager.GENERAL);
						EmbedSender.sendEmbed(event.getTextChannel(), null, "**BirthdayBot** does not have permission to create a channel!", Color.RED);
						getBirthdayRole(event, member);
						return;
					}

					switch (e.getReactionEmote().getName()) {
						case "\uD83D\uDD28": //Create New
							EnumSet<Permission> grantPublic = EnumSet.of(Permission.VIEW_CHANNEL), //Application Permissions
									denyPublic = EnumSet.of(Permission.MESSAGE_WRITE);
							Role publicRole = event.getGuild().getPublicRole();

							event.getGuild().createTextChannel("birthdays")
									.setTopic("Birthday Announcements!")
									.addPermissionOverride(publicRole, grantPublic, denyPublic)
									.queue(r -> {
										EmbedSender.sendEmbed(event.getTextChannel(), null, "Successfully created the birthday channel **" + r.getAsMention() + "**!", Color.decode("#1CFE86"));
										db.updateBirthdayChannel(event, r);
										result.delete().queue(null, ErrorManager.GENERAL);
										getBirthdayRole(event, member);
									}, error -> {
										if (error instanceof PermissionException) {
											EmbedSender.sendEmbed(event.getTextChannel(), null, "**BirthdayBot** does not have permission to create a channel!", Color.RED);
										} else {
											Logger.Error("Could not create a birthday channel for " + event.getGuild().getName() + "(" + event.getGuild().getId() + ")", error);
										}
									});
							break;
						case "\uD83D\uDDB1": //Select Pre-Existing
							EmbedSender.sendEmbed(event.getTextChannel(), null, "Please mention a channel or input a channel's name.", Color.GREEN);

							waitForBirthdayChannelSelection(event, result);
							break;
						default: //None
							EmbedSender.sendEmbed(event.getTextChannel(), null, "A Birthday Channel will not be set.", Color.RED);
							result.delete().queue(null, ErrorManager.GENERAL);
							getBirthdayRole(event, member);
							break;
					}


				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.GENERAL);
				});
	}


	private void waitForBirthdayChannelSelection(CommandEvent event, Message result) {

		waiter.waitForEvent(MessageReceivedEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember())),
				e -> {

					String[] args = e.getMessage().getContentRaw().split(" ");

					TextChannel bdayChannel = null;

					try {
						bdayChannel = e.getMessage().getMentionedChannels().get(0);
					} catch (IndexOutOfBoundsException ex) {
						bdayChannel = event.getGuild().getTextChannels().stream().filter(channel -> channel.getName().equalsIgnoreCase(args[0])).findFirst().orElse(null);
					}
					if (bdayChannel == null) {
						EmbedSender.sendEmbed(event.getTextChannel(), null, "The specified channel cannot be found.", Color.RED);
						result.delete().queue(null, ErrorManager.GENERAL);
						return;
					}

					db.updateBirthdayChannel(event, bdayChannel);
					EmbedSender.sendEmbed(event.getTextChannel(), null, "Successfully set the birthday channel to " + bdayChannel.getAsMention() + "!", Color.decode("#1CFE86"));
					result.delete().queue(null, ErrorManager.GENERAL);
					getBirthdayRole(event, event.getMember());

				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.GENERAL);
				});
	}


	public void getBirthdayRole(CommandEvent event, Member author) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getEffectiveName() + "#" + author.getUser().getDiscriminator(), null, author.getUser().getAvatarUrl())
				.setTitle("**Server Setup - Birthday Role Selection**")
				.setDescription("" +
						"\n » Now you must choose a Birthday Role. This allows the bot to know what role to give for user's birthdays!" +
						"\n" +
						"\nPlease select which option you would like")
				.addField("Create New Role \uD83D\uDD28" +
						"\nSelect Pre-Existing Role \uD83D\uDDB1" +
						"\nNo Birthday Role \u274C", "", false)
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			result.addReaction(CREATE_EMOJI).queue(null, ErrorManager.GENERAL);
			result.addReaction(SELECT_EMOJI).queue(null, ErrorManager.GENERAL);
			result.addReaction(NO_EMOJI).queue(null, ErrorManager.GENERAL);
			waitForBirthdayRole(event, result);
		}, ErrorManager.GENERAL);
	}


	private void waitForBirthdayRole(CommandEvent event, Message result) {

		waiter.waitForEvent(MessageReactionAddEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember()) &&
						(e.getReactionEmote().getName().equals("\uD83D\uDD28") || e.getReactionEmote().getName().equals("\uD83D\uDDB1") || e.getReactionEmote().getName().equals("\u274C"))),
				e -> {

					if (!event.getSelfMember().hasPermission(Permission.MANAGE_ROLES)) {
						result.delete().queue(null, ErrorManager.GENERAL);
						EmbedSender.sendEmbed(event.getTextChannel(), null, "**BirthdayBot** does not have permission to create a role!", Color.RED);
						return;
					}

					switch (e.getReactionEmote().getName()) {
						case "\uD83D\uDD28": //Create New
							event.getGuild().createRole()
									.setName("\uD83C\uDF82")
									.setColor(Color.decode("#AC1CFE"))
									.setHoisted(true)
									.queue(r -> {
										String message = "Successfully created the birthday role **" + r.getAsMention() + "**!" +
												"\n" +
												"\nNote: Please move <@656621136808902656>'s Role to the top of the role list and move the new Birthday Role under" +
												"<@656621136808902656>'s Role.";
										EmbedSender.sendEmbed(event.getTextChannel(), null, message, Color.decode("#1CFE86"));
										db.updateBirthdayRole(event, r);
										result.delete().queue(null, ErrorManager.GENERAL);
									}, error -> {
										if (error instanceof PermissionException) {
											EmbedSender.sendEmbed(event.getTextChannel(), null, "**BirthdayBot** does not have permission to create a role!", Color.RED);
										} else {
											Logger.Error("Could not create a birthday role for " + event.getGuild().getName() + "(" + event.getGuild().getId() + ")", error);
										}
									});
							break;
						case "\uD83D\uDDB1": //Select Pre-Existing
							EmbedBuilder builder = new EmbedBuilder();
							builder.setColor(Color.decode("#1CFE86"))
									.setDescription("Please mention a Role or input a Role's name.");
							event.getTextChannel().sendMessage(builder.build()).queue(null, ErrorManager.GENERAL);

							waitForBirthdayRoleSelection(event, result);
							break;
						default: //None
							EmbedSender.sendEmbed(event.getTextChannel(), null, "A Birthday Role will not be set.", Color.RED);
							result.delete().queue(null, ErrorManager.GENERAL);
							break;
					}
				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.GENERAL);
				});
	}

	private void waitForBirthdayRoleSelection(CommandEvent event, Message result) {

		waiter.waitForEvent(MessageReceivedEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember())),
				e -> {

					String[] args = e.getMessage().getContentRaw().split(" ");

					Role bdayRole;

					try {
						bdayRole = e.getMessage().getMentionedRoles().get(0);
					} catch (IndexOutOfBoundsException ex) {
						bdayRole = event.getGuild().getRoles().stream().filter(role -> role.getName().equalsIgnoreCase(args[0])).findFirst().orElse(null);
					}
					if (bdayRole == null) {
						EmbedSender.sendEmbed(event.getTextChannel(), null, "The specified role cannot be found.", Color.RED);
						result.delete().queue(null, ErrorManager.GENERAL);
						return;
					}

					db.updateBirthdayRole(event, bdayRole);
					String message = "Successfully set the birthday role to " + bdayRole.getAsMention() + "!" +
							"\n" +
							"\nNote: Please move <@656621136808902656>'s Role to the top of the role list and move the new Birthday Role under" +
							"<@656621136808902656>'s Role.";
					EmbedSender.sendEmbed(event.getTextChannel(), null, message, Color.decode("#1CFE86"));
					result.delete().queue(null, ErrorManager.GENERAL);

				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.GENERAL);
				});
	}

	public void getBirthdayTime(CommandEvent event, Member author) {

		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getEffectiveName() + "#" + author.getUser().getDiscriminator(), null, author.getUser().getAvatarUrl())
				.setTitle("**Server Setup - Birthday Message Time**")
				.setDescription("" +
						"\n » Now you must give an __hour__ for your Birthday Messages. This will tell bot what hour to send the Birthday Messages!" +
						"\n" +
						"\nAccepted Values: `0-23`" +
						"\nDefault Value: `0`" +
						"\n" +
						"\n**Example Usage**: `13` (1PM)")
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			waitForBirthdayTime(event, result);
		}, ErrorManager.GENERAL);
	}

	private void waitForBirthdayTime(CommandEvent event, Message result) {

		waiter.waitForEvent(MessageReceivedEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember())),
				e -> {

					String[] args = e.getMessage().getContentRaw().split(" ");

					int time;

					try {
						time = Integer.parseInt(args[0]);
					} catch (NumberFormatException ex) {
						EmbedSender.sendEmbed(event.getTextChannel(), null, "Your time was invalid. \nAcceptable Time Range: `<0-23>`", Color.RED);
						result.delete().queue(null, ErrorManager.GENERAL);
						return;
					}
					if (time < 0 || time > 23) {
						EmbedSender.sendEmbed(event.getTextChannel(), null, "Your time was invalid. \nAcceptable Time Range: `<0-23>`", Color.RED);
						result.delete().queue(null, ErrorManager.GENERAL);
						return;
					}

					db.updateGuildMessageTime(event.getGuild(), time);
					String timeMessage;
					if (time == 0) timeMessage = "12:00 AM";
					else if (time < 12) timeMessage = time + ":00 AM";
					else timeMessage = (time - 12) + ":00 PM";
					EmbedSender.sendEmbed(event.getTextChannel(), null, "Successfully set the Birthday Messages to send at " + timeMessage, Color.decode("#1CFE86"));

					result.delete().queue(null, ErrorManager.GENERAL);
					getCustomBirthdayMessage(event, event.getMember());
				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.GENERAL);
				});
	}

	public void getCustomBirthdayMessage(CommandEvent event, Member author) {

		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getEffectiveName() + "#" + author.getUser().getDiscriminator(), null, author.getUser().getAvatarUrl())
				.setTitle("**Server Setup - Custom Birthday Message**")
				.setDescription("" +
						"\n » Now you can create a custom Birthday Message. This will tell bot what message to send as the Birthday Messages!" +
						"\n" +
						"\nUse the `@Users` placeholder in your Custom Birthday Message and the bot will replace it with the username of the member(s) who birthday it is!" +
						"\n" +
						"\nDefault Value: `Happy Birthday @Users!`" +
						"\nTo use the default Message use: `default`" +
						"\n**Example Usage**: `Everyone, wish @Users a happy Birthday!`" +
						"\n**Result**: Everyone, wish <@478288246858711040> a happy Birthday!")
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			waitForCustomBirthdayMessage(event, result);
		}, ErrorManager.GENERAL);
	}

	private void waitForCustomBirthdayMessage(CommandEvent event, Message result) {

		waiter.waitForEvent(MessageReceivedEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember())),
				e -> {
					String[] args = e.getMessage().getContentRaw().split(" ");

					StringBuilder message = new StringBuilder(args[0]);

					for (int i = 1; i < args.length; i++)
						message.append(" ").append(args[i]);

					if (message.length() > 2000) {
						EmbedSender.sendEmbed(event.getTextChannel(), null, "The birthday message is too large.", Color.RED);
						result.delete().queue(null, ErrorManager.GENERAL);
						return;
					}

					result.delete().queue(null, ErrorManager.GENERAL);
					if (message.toString().equalsIgnoreCase("default")) {
						db.updateMessage(event, "0");
						EmbedSender.sendEmbed(event.getTextChannel(), null, "Birthday Bot will use the default Birthday Message!\nTest this with `bday testMessage`!", Color.decode("#1CFE86"));
					} else {
						String bMessage = message.toString().replaceAll("@users", "@Users");
						db.updateMessage(event, bMessage);
						EmbedSender.sendEmbed(event.getTextChannel(), null, "Successfully set the birthday message to **" + message.toString() + "**\nTest this with `bday testMessage`!", Color.decode("#1CFE86"));
					}
					getMentionSetting(event, event.getMember());

				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.GENERAL);
				});
	}

	public void getMentionSetting(CommandEvent event, Member author) {

		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getEffectiveName() + "#" + author.getUser().getDiscriminator(), null, author.getUser().getAvatarUrl())
				.setTitle("**Server Setup - Custom Birthday Message**")
				.setDescription("" +
						"\n » Now you can set your birthday mention setting. This is the group the bot will @ when it sends a birthday message." +
						"\n" +
						"\nAcceptable inputs: `everyone`, `here`, `@role/role-name`, `disabled`" +
						"\n" +
						"\nDefault Value: `disabled`")
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			waitForMentionSetting(event, result);
		}, ErrorManager.GENERAL);
	}

	private void waitForMentionSetting(CommandEvent event, Message result) {

		waiter.waitForEvent(MessageReceivedEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember())),
				e -> {
					String[] args = e.getMessage().getContentRaw().split(" ");
					switch (args[0].toLowerCase()) {
						case "everyone":
							db.updateMentionedSetting(event, "everyone");
							EmbedSender.sendEmbed(event.getTextChannel(), null, "The birthday message will now mention @everyone!", Color.decode("#1CFE86"));
							break;
						case "here":
							db.updateMentionedSetting(event, "here");
							EmbedSender.sendEmbed(event.getTextChannel(), null, "The birthday message will now mention @here!", Color.decode("#1CFE86"));
							break;
						case "disabled":
							db.updateMentionedSetting(event, "0");
							EmbedSender.sendEmbed(event.getTextChannel(), null, "The birthday message will not mention anyone.", Color.decode("#1CFE86"));
							break;
						default:
							Role mentionedRole;
							try {
								mentionedRole = event.getMessage().getMentionedRoles().get(0);
							} catch (IndexOutOfBoundsException ex) {
								mentionedRole = event.getGuild().getRoles().stream().filter(role -> role.getName().toLowerCase().contains(args[0].toLowerCase())).findFirst().orElse(null);
							}
							if (mentionedRole == null) {
								EmbedSender.sendEmbed(event.getTextChannel(), null, "The specified role cannot be found.", Color.RED);
								result.delete().queue(null, ErrorManager.GENERAL);
								return;
							}
							if (!mentionedRole.isMentionable()) {
								EmbedSender.sendEmbed(event.getTextChannel(), null, "The specified role is not mentionable. Please change this in your role settings.", Color.RED);
								result.delete().queue(null, ErrorManager.GENERAL);
								return;
							}

							db.updateMentionedSetting(event, mentionedRole.getId());
							EmbedSender.sendEmbed(event.getTextChannel(), null, "The birthday message will now mention " + mentionedRole.getAsMention() + "!", Color.decode("#1CFE86"));
							break;
					}
					result.delete().queue(null, ErrorManager.GENERAL);
					getTrustedRole(event, event.getMember());

				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.GENERAL);
				});
	}

	public void getTrustedRole(CommandEvent event, Member author) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getEffectiveName() + "#" + author.getUser().getDiscriminator(), null, author.getUser().getAvatarUrl())
				.setTitle("**Server Setup - Trusted Role Selection**")
				.setDescription("" +
						"\n » You may now choose your Trusted Role! " +
						"\n\nThe idea behind a Trusted Role is that users without this role will not have their birthdays " +
						"announced and/or given the birthday role on their birthday. This is useful in large servers to prevent celebrating 1000s of birthdays and instead " +
						"only celebrating staff or VIP birthdays." +
						"\n" +
						"\nPlease select which option you would like")
				.addField("Create New Role \uD83D\uDD28" +
						"\nSelect Pre-Existing Role \uD83D\uDDB1" +
						"\nNo Trusted Role \u274C", "", false)
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			result.addReaction(CREATE_EMOJI).queue(null, ErrorManager.GENERAL);
			result.addReaction(SELECT_EMOJI).queue(null, ErrorManager.GENERAL);
			result.addReaction(NO_EMOJI).queue(null, ErrorManager.GENERAL);
			waitForTrustedRole(event, result);
		}, ErrorManager.GENERAL);
	}

	private void waitForTrustedRole(CommandEvent event, Message result) {

		waiter.waitForEvent(MessageReactionAddEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember()) &&
						(e.getReactionEmote().getName().equals("\uD83D\uDD28") || e.getReactionEmote().getName().equals("\uD83D\uDDB1") || e.getReactionEmote().getName().equals("\u274C"))),
				e -> {

					if (!event.getSelfMember().hasPermission(Permission.MANAGE_ROLES)) {
						result.delete().queue(null, ErrorManager.GENERAL);
						EmbedSender.sendEmbed(event.getTextChannel(), null, "**BirthdayBot** does not have permission to create a role!", Color.RED);
						getTrustedPreventsRole(event, event.getMember());
						return;
					}

					switch (e.getReactionEmote().getName()) {
						case "\uD83D\uDD28": //Create New
							event.getGuild().createRole()
									.setName("BirthdayTrusted")
									.queue(r -> {
										EmbedSender.sendEmbed(event.getTextChannel(), null, "Successfully created the trusted role **" + r.getAsMention() + "**!", Color.decode("#1CFE86"));
										result.delete().queue(null, ErrorManager.GENERAL);
										db.updateTrustedRole(event, r);
										getTrustedPreventsRole(event, event.getMember());
									}, error -> {
										if (error instanceof PermissionException) {
											EmbedSender.sendEmbed(event.getTextChannel(), null, "**BirthdayBot** does not have permission to create a Role!", Color.RED);
										} else {
											Logger.Error("Could not create a trusted role for " + event.getGuild().getName() + "(" + event.getGuild().getId() + ")", error);
										}
									});
							break;
						case "\uD83D\uDDB1": //Select Pre-Existing
							EmbedBuilder builder = new EmbedBuilder();
							builder.setColor(Color.decode("#1CFE86"))
									.setDescription("Please mention a Role or input a Role's name.");
							event.getTextChannel().sendMessage(builder.build()).queue(null, ErrorManager.GENERAL);

							waitForTrustedRoleSelection(event, result);
							break;
						default: //None
							EmbedSender.sendEmbed(event.getTextChannel(), null, "A Trusted Role will not be set.", Color.RED);
							result.delete().queue(null, ErrorManager.GENERAL);
							getTrustedPreventsRole(event, event.getMember());
							break;
					}
				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.GENERAL);
				});
	}

	private void waitForTrustedRoleSelection(CommandEvent event, Message result) {

		waiter.waitForEvent(MessageReceivedEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember())),
				e -> {

					String[] args = e.getMessage().getContentRaw().split(" ");

					Role trustedRole = null;

					try {
						trustedRole = e.getMessage().getMentionedRoles().get(0);
					} catch (IndexOutOfBoundsException ex) {
						trustedRole = event.getGuild().getRoles().stream().filter(role -> role.getName().equalsIgnoreCase(args[0])).findFirst().orElse(null);
					}
					if (trustedRole == null) {
						EmbedSender.sendEmbed(event.getTextChannel(), null, "The specified role cannot be found.", Color.RED);
						result.delete().queue(null, ErrorManager.GENERAL);
						return;
					}

					db.updateTrustedRole(event, trustedRole);
					EmbedSender.sendEmbed(event.getTextChannel(), null, "Successfully set the trusted role to " + trustedRole.getAsMention() + "!", Color.decode("#1CFE86"));
					result.delete().queue(null, ErrorManager.GENERAL);
					getTrustedPreventsRole(event, event.getMember());
				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.GENERAL);
				});
	}


	public void getTrustedPreventsRole(CommandEvent event, Member author) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getEffectiveName() + "#" + author.getUser().getDiscriminator(), null, author.getUser().getAvatarUrl())
				.setTitle("**Server Setup - Trusted Role Options**")
				.setDescription("" +
						"\n » You may now choose settings for the Trusted Role. Should the bot only give the Birthday Role for users with the Trusted Role?" +
						"\n" +
						"\nPlease select which option you would like")
				.addField("Yes (Default) \u2705" +
						"\nNo (Everyone gets the Role) \u274C", "", false)
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			result.addReaction(YES_EMOJI).queue(null, ErrorManager.GENERAL);
			result.addReaction(NO_EMOJI).queue(null, ErrorManager.GENERAL);
			waitForTrustedPreventsRole(event, result);
		}, ErrorManager.GENERAL);
	}

	private void waitForTrustedPreventsRole(CommandEvent event, Message result) {
		TextChannel channel = event.getTextChannel();

		waiter.waitForEvent(MessageReactionAddEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember()) &&
						(e.getReactionEmote().getName().equals("\u2705") || e.getReactionEmote().getName().equals("\u274C"))),
				e -> {
					switch (e.getReactionEmote().getName()) {
						case "\u2705": //Yes
							db.updatePreventRole(event, 1);

							String message = "**BirthdayBot** will only grant the birthday role with users with the trusted role now!";
							EmbedSender.sendEmbed(channel, null, message, Color.decode("#1CFE86"));

							result.delete().queue(null, ErrorManager.GENERAL);
							getTrustedPreventsMessage(event, event.getMember());
							break;
						case "\u274C": //No
							db.updatePreventRole(event, 0);

							String message2 = "**BirthdayBot** will grant the birthday role to all users regardless of if the user has the trusted role!";
							EmbedSender.sendEmbed(channel, null, message2, Color.decode("#1CFE86"));

							result.delete().queue(null, ErrorManager.GENERAL);
							getTrustedPreventsMessage(event, event.getMember());
							break;
					}
				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.GENERAL);
				});
	}

	public void getTrustedPreventsMessage(CommandEvent event, Member author) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getEffectiveName() + "#" + author.getUser().getDiscriminator(), null, author.getUser().getAvatarUrl())
				.setTitle("**Server Setup - Trusted Role Options**")
				.setDescription("" +
						"\n » You may now choose settings for the Trusted Role. Should the bot only send Birthday Messages for users with the Trusted Role?" +
						"\n" +
						"\nPlease select which option you would like")
				.addField("Yes (Default) \u2705" +
						"\nNo (Birthday messages for everyone) \u274C", "", false)
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			result.addReaction(YES_EMOJI).queue(null, ErrorManager.GENERAL);
			result.addReaction(NO_EMOJI).queue(null, ErrorManager.GENERAL);
			waitForTrustedPreventsMessage(event, result);
		}, ErrorManager.GENERAL);
	}

	private void waitForTrustedPreventsMessage(CommandEvent event, Message result) {
		TextChannel channel = event.getTextChannel();

		waiter.waitForEvent(MessageReactionAddEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember()) &&
						(e.getReactionEmote().getName().equals("\u2705") || e.getReactionEmote().getName().equals("\u274C"))),
				e -> {
					switch (e.getReactionEmote().getName()) {
						case "\u2705": //Yes
							db.updatePreventMessage(event, 1);

							String message = "**BirthdayBot** will only send messages for users with the trusted role now!";
							EmbedSender.sendEmbed(channel, null, message, Color.decode("#1CFE86"));

							result.delete().queue(null, ErrorManager.GENERAL);
							break;
						case "\u274C": //No
							db.updatePreventMessage(event, 0);

							String message2 = "**BirthdayBot** will send birthday messages to all users regardless of if the user has the trusted role!";
							EmbedSender.sendEmbed(channel, null, message2, Color.decode("#1CFE86"));

							result.delete().queue(null, ErrorManager.GENERAL);
							break;
					}
				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.GENERAL);
				});
	}


}
