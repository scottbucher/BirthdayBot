package me.stqlth.birthdaybot.commands.staff;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import com.jagrosh.jdautilities.commons.waiter.EventWaiter;
import me.stqlth.birthdaybot.messages.discordOut.StaffMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.ErrorManager;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.events.message.react.MessageReactionAddEvent;

import java.awt.*;
import java.util.EnumSet;
import java.util.Objects;
import java.util.concurrent.TimeUnit;


public class Setup extends Command {

	private EventWaiter waiter;
	private StaffMessages staffMessages;
	private DatabaseMethods db;

	public Setup(DatabaseMethods databaseMethods, StaffMessages staffMessages, EventWaiter waiter) {
		this.name = "setup";
		this.guildOnly = true;
		this.help = "Setup a Guild's server settings";

		this.db = databaseMethods;
		this.staffMessages = staffMessages;
		this.waiter = waiter;
	}

	@Override
	protected void execute(CommandEvent event) {
		Permission req = Permission.ADMINISTRATOR;
		Member member = event.getMember();
		if (!member.hasPermission(req)) {
			staffMessages.onlyAdmins(event.getTextChannel());
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
				.setTitle("**Server Setup [BETA] - Birthday Channel Selection**")
				.setDescription("" +
						"\n » To begin your setup you must set your birthday channel. This allows the bot to know where to send birthday messages!" +
						"\n" +
						"\nPlease select which option you would like")
				.addField("Create New Channel \uD83D\uDD28" +
						"\nSelect Pre-Existing Channel \uD83D\uDDB1" +
						"\nNo Birthday Channel \u274C", "", false)
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			result.addReaction("\uD83D\uDD28").queue(null, ErrorManager.PERMISSION);
			result.addReaction("\uD83D\uDDB1").queue(null, ErrorManager.PERMISSION);
			result.addReaction("\u274C").queue(null, ErrorManager.PERMISSION);
			waitForChannel(event, result, author);
		}, ErrorManager.PERMISSION);


	}

	private void waitForChannel(CommandEvent event, Message result, Member member) {

		waiter.waitForEvent(MessageReactionAddEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember()) &&
						(e.getReactionEmote().getName().equals("\uD83D\uDD28") || e.getReactionEmote().getName().equals("\uD83D\uDDB1") || e.getReactionEmote().getName().equals("\u274C"))),
				e -> {


					switch (e.getReactionEmote().getName()) {
						case "\uD83D\uDD28": //Create New
							EnumSet<Permission> grantPublic = EnumSet.of(Permission.VIEW_CHANNEL), //Application Permissions
									denyPublic = EnumSet.of(Permission.MESSAGE_WRITE);
							Role publicRole = event.getGuild().getPublicRole();

							event.getGuild().createTextChannel("birthdays")
									.setTopic("Birthday Announcements!")
									.addPermissionOverride(publicRole, grantPublic, denyPublic)
									.queue(r -> {
										staffMessages.successChannelCreate(event.getTextChannel(), r);
										db.updateBirthdayChannel(event, r);
										result.delete().queue(null, ErrorManager.PERMISSION);
										getBirthdayRole(event, member);
									}, ErrorManager.PERMISSION);
							break;
						case "\uD83D\uDDB1": //Select Pre-Existing
							EmbedBuilder builder = new EmbedBuilder();
							builder.setColor(Color.decode("#1CFE86"))
									.setDescription("Please mention a channel or input a channel's name.");
							event.getTextChannel().sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);

							waitForBirthdayChannelSelection(event, result);
							break;
						default: //None
							staffMessages.choseNoChannel(event.getTextChannel());
							result.delete().queue(null, ErrorManager.PERMISSION);
							getBirthdayRole(event, member);
							break;
					}


				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.PERMISSION);
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
						staffMessages.channelNotFound(event.getTextChannel());
						result.delete().queue(null, ErrorManager.PERMISSION);
						return;
					}

					db.updateBirthdayChannel(event, bdayChannel);
					staffMessages.successChannel(event.getTextChannel(), bdayChannel);
					result.delete().queue(null, ErrorManager.PERMISSION);
					getBirthdayRole(event, event.getMember());

				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.PERMISSION);
				});
	}


	public void getBirthdayRole(CommandEvent event, Member author) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getEffectiveName() + "#" + author.getUser().getDiscriminator(), null, author.getUser().getAvatarUrl())
				.setTitle("**Server Setup [BETA] - Birthday Role Selection**")
				.setDescription("" +
						"\n » Now you must choose a Birthday Role. This allows the bot to know what role to give for user's birthdays!" +
						"\n" +
						"\nPlease select which option you would like")
				.addField("Create New Role \uD83D\uDD28" +
						"\nSelect Pre-Existing Role \uD83D\uDDB1" +
						"\nNo Birthday Role \u274C", "", false)
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			result.addReaction("\uD83D\uDD28").queue(null, ErrorManager.PERMISSION);
			result.addReaction("\uD83D\uDDB1").queue(null, ErrorManager.PERMISSION);
			result.addReaction("\u274C").queue(null, ErrorManager.PERMISSION);
			waitForBirthdayRole(event, result);
		}, ErrorManager.PERMISSION);
	}


	private void waitForBirthdayRole(CommandEvent event, Message result) {

		waiter.waitForEvent(MessageReactionAddEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember()) &&
						(e.getReactionEmote().getName().equals("\uD83D\uDD28") || e.getReactionEmote().getName().equals("\uD83D\uDDB1") || e.getReactionEmote().getName().equals("\u274C"))),
				e -> {
					switch (e.getReactionEmote().getName()) {
						case "\uD83D\uDD28": //Create New
							event.getGuild().createRole()
									.setName("\uD83C\uDF82")
									.setColor(Color.decode("#AC1CFE"))
									.setHoisted(true)
									.queue(r -> {
										staffMessages.successBdayRoleCreate(event.getTextChannel(), r);
										db.updateBirthdayRole(event, r);
										result.delete().queue(null, ErrorManager.PERMISSION);
									}, ErrorManager.PERMISSION);
							break;
						case "\uD83D\uDDB1": //Select Pre-Existing
							EmbedBuilder builder = new EmbedBuilder();
							builder.setColor(Color.decode("#1CFE86"))
									.setDescription("Please mention a Role or input a Role's name.");
							event.getTextChannel().sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);

							waitForBirthdayRoleSelection(event, result);
							break;
						default: //None
							staffMessages.choseNoBirthdayRole(event.getTextChannel());
							result.delete().queue(null, ErrorManager.PERMISSION);
							break;
					}
				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.PERMISSION);
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
						staffMessages.channelNotFound(event.getTextChannel());
						result.delete().queue(null, ErrorManager.PERMISSION);
						return;
					}

					db.updateBirthdayRole(event, bdayRole);
					staffMessages.successBdayRole(event.getTextChannel(), bdayRole);
					result.delete().queue(null, ErrorManager.PERMISSION);

				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.PERMISSION);
				});
	}

	public void getBirthdayTime(CommandEvent event, Member author) {

		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getEffectiveName() + "#" + author.getUser().getDiscriminator(), null, author.getUser().getAvatarUrl())
				.setTitle("**Server Setup [BETA] - Birthday Message Time**")
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
		}, ErrorManager.PERMISSION);
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
						staffMessages.invalidBirthdayTime(event.getTextChannel());
						result.delete().queue(null, ErrorManager.PERMISSION);
						return;
					}
					if (time < 0 || time > 23) {
						staffMessages.invalidBirthdayTime(event.getTextChannel());
						result.delete().queue(null, ErrorManager.PERMISSION);
						return;
					}

					db.updateGuildMessageTime(event.getGuild(), time);
					staffMessages.successMessageTime(event.getTextChannel(), time);
					result.delete().queue(null, ErrorManager.PERMISSION);
					getCustomBirthdayMessage(event, event.getMember());

				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.PERMISSION);
				});
	}

	public void getCustomBirthdayMessage(CommandEvent event, Member author) {

		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getEffectiveName() + "#" + author.getUser().getDiscriminator(), null, author.getUser().getAvatarUrl())
				.setTitle("**Server Setup [BETA] - Custom Birthday Message**")
				.setDescription("" +
						"\n » Now you can create a custom Birthday Message. This will tell bot what message to send as the Birthday Messages!" +
						"\n" +
						"\nUse the `@Users` placeholder in your Custom Birthday Message and the bot will replace it with the username of the member(s) who birthday it is!" +
						"\n" +
						"\nDefault Value: `Happy Birthday @Users!`" +
						"\n**Example Usage**: `Everyone, wish @Users a happy Birthday!`" +
						"\n**Result**: Everyone, wish <@478288246858711040> a happy Birthday!")
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			waitForCustomBirthdayMessage(event, result);
		}, ErrorManager.PERMISSION);
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
						staffMessages.messageTooLarge(event.getTextChannel());
						result.delete().queue(null, ErrorManager.PERMISSION);
						return;
					}

					db.updateMessage(event, message.toString());
					result.delete().queue(null, ErrorManager.PERMISSION);
					staffMessages.successMessage(event.getTextChannel(), message.toString());
					getMentionSetting(event, event.getMember());

				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.PERMISSION);
				});
	}

	public void getMentionSetting(CommandEvent event, Member author) {

		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getEffectiveName() + "#" + author.getUser().getDiscriminator(), null, author.getUser().getAvatarUrl())
				.setTitle("**Server Setup [BETA] - Custom Birthday Message**")
				.setDescription("" +
						"\n » Now you can set your birthday mention setting. This is the group the bot will @ when it sends a birthday message." +
						"\n" +
						"\nAcceptable inputs: `everyone`, `here`, `@role/role-name`, `disabled`" +
						"\n" +
						"\nDefault Value: `disabled`")
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			waitForMentionSetting(event, result);
		}, ErrorManager.PERMISSION);
	}

	private void waitForMentionSetting(CommandEvent event, Message result) {

		waiter.waitForEvent(MessageReceivedEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember())),
				e -> {
					String[] args = e.getMessage().getContentRaw().split(" ");
					switch (args[0].toLowerCase()) {
						case "everyone":
							db.updateMentionedSetting(event, "everyone");
							staffMessages.successMentionSetting(event.getTextChannel(), "everyone");
							break;
						case "here":
							db.updateMentionedSetting(event, "here");
							staffMessages.successMentionSetting(event.getTextChannel(), "here");
							break;
						case "disable":
							db.updateMentionedSetting(event, "0");
							staffMessages.disableMentionSetting(event.getTextChannel());
							break;
						default:
							Role mentionedRole;
							try {
								mentionedRole = event.getMessage().getMentionedRoles().get(0);
							} catch (IndexOutOfBoundsException ex) {
								mentionedRole = event.getGuild().getRoles().stream().filter(role -> role.getName().toLowerCase().contains(args[0].toLowerCase())).findFirst().orElse(null);
							}
							if (mentionedRole == null) {
								staffMessages.roleNotFound(event.getTextChannel());
								result.delete().queue(null, ErrorManager.PERMISSION);
								return;
							}
							if (!mentionedRole.isMentionable()) {
								staffMessages.roleNotMentionable(event.getTextChannel());
								result.delete().queue(null, ErrorManager.PERMISSION);
								return;
							}

							db.updateMentionedSetting(event, mentionedRole.getId());
							staffMessages.successRoleMentionSetting(event.getTextChannel(), mentionedRole);
							break;
					}
					result.delete().queue(null, ErrorManager.PERMISSION);
					getTrustedRole(event, event.getMember());

				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.PERMISSION);
				});
	}

	public void getTrustedRole(CommandEvent event, Member author) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getEffectiveName() + "#" + author.getUser().getDiscriminator(), null, author.getUser().getAvatarUrl())
				.setTitle("**Server Setup [BETA] - Trusted Role Selection**")
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
			result.addReaction("\uD83D\uDD28").queue(null, ErrorManager.PERMISSION);
			result.addReaction("\uD83D\uDDB1").queue(null, ErrorManager.PERMISSION);
			result.addReaction("\u274C").queue(null, ErrorManager.PERMISSION);
			waitForTrustedRole(event, result);
		}, ErrorManager.PERMISSION);
	}

	private void waitForTrustedRole(CommandEvent event, Message result) {

		waiter.waitForEvent(MessageReactionAddEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember()) &&
						(e.getReactionEmote().getName().equals("\uD83D\uDD28") || e.getReactionEmote().getName().equals("\uD83D\uDDB1") || e.getReactionEmote().getName().equals("\u274C"))),
				e -> {
					switch (e.getReactionEmote().getName()) {
						case "\uD83D\uDD28": //Create New
							event.getGuild().createRole()
									.setName("BirthdayTrusted")
									.queue(r -> {
										staffMessages.successTrustedRoleCreate(event.getTextChannel(), r);
										result.delete().queue(null, ErrorManager.PERMISSION);
										db.updateTrustedRole(event, r);
										getTrustedPreventsRole(event, event.getMember());
									});
							break;
						case "\uD83D\uDDB1": //Select Pre-Existing
							EmbedBuilder builder = new EmbedBuilder();
							builder.setColor(Color.decode("#1CFE86"))
									.setDescription("Please mention a Role or input a Role's name.");
							event.getTextChannel().sendMessage(builder.build()).queue(null, ErrorManager.PERMISSION);

							waitForTrustedRoleSelection(event, result);
							break;
						default: //None
							staffMessages.choseNoTrustedRole(event.getTextChannel());
							result.delete().queue(null, ErrorManager.PERMISSION);
							getTrustedPreventsRole(event, event.getMember());
							break;
					}
				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.PERMISSION);
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
						staffMessages.channelNotFound(event.getTextChannel());
						result.delete().queue(null, ErrorManager.PERMISSION);
						return;
					}

					db.updateTrustedRole(event, trustedRole);
					staffMessages.successTrustedRole(event.getTextChannel(), trustedRole);
					result.delete().queue(null, ErrorManager.PERMISSION);
					getTrustedPreventsRole(event, event.getMember());
				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.PERMISSION);
				});
	}


	public void getTrustedPreventsRole(CommandEvent event, Member author) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getEffectiveName() + "#" + author.getUser().getDiscriminator(), null, author.getUser().getAvatarUrl())
				.setTitle("**Server Setup [BETA] - Trusted Role Options**")
				.setDescription("" +
						"\n » You may now choose settings for the Trusted Role. Should the bot only give the Birthday Role for users with the Trusted Role?" +
						"\n" +
						"\nPlease select which option you would like")
				.addField("Yes (Default) \u2705" +
						"\nNo (Everyone gets the Role) \u274C", "", false)
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			result.addReaction("\u2705").queue(null, ErrorManager.PERMISSION);
			result.addReaction("\u274C").queue(null, ErrorManager.PERMISSION);
			waitForTrustedPreventsRole(event, result);
		}, ErrorManager.PERMISSION);
	}

	private void waitForTrustedPreventsRole(CommandEvent event, Message result) {

		waiter.waitForEvent(MessageReactionAddEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember()) &&
						(e.getReactionEmote().getName().equals("\u2705") || e.getReactionEmote().getName().equals("\u274C"))),
				e -> {
					switch (e.getReactionEmote().getName()) {
						case "\u2705": //Yes
							db.updatePreventRole(event, 1);
							staffMessages.setPreventRole(event.getTextChannel(), true);
							result.delete().queue(null, ErrorManager.PERMISSION);
							getTrustedPreventsMessage(event, event.getMember());
							break;
						case "\u274C": //No
							db.updatePreventRole(event, 0);
							staffMessages.setPreventRole(event.getTextChannel(), false);
							result.delete().queue(null, ErrorManager.PERMISSION);
							getTrustedPreventsMessage(event, event.getMember());
							break;
					}
				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.PERMISSION);
				});
	}

	public void getTrustedPreventsMessage(CommandEvent event, Member author) {
		EmbedBuilder builder = new EmbedBuilder();

		builder.setColor(Color.decode("#1CFE86"))
				.setAuthor(author.getEffectiveName() + "#" + author.getUser().getDiscriminator(), null, author.getUser().getAvatarUrl())
				.setTitle("**Server Setup [BETA] - Trusted Role Options**")
				.setDescription("" +
						"\n » You may now choose settings for the Trusted Role. Should the bot only send Birthday Messages for users with the Trusted Role?" +
						"\n" +
						"\nPlease select which option you would like")
				.addField("Yes (Default) \u2705" +
						"\nNo (Birthday messages for everyone) \u274C", "", false)
				.setFooter("This message will timeout in 1 minute!", event.getJDA().getSelfUser().getAvatarUrl());

		event.getTextChannel().sendMessage(builder.build()).queue(result -> {
			result.addReaction("\u2705").queue(null, ErrorManager.PERMISSION);
			result.addReaction("\u274C").queue(null, ErrorManager.PERMISSION);
			waitForTrustedPreventsMessage(event, result);
		}, ErrorManager.PERMISSION);
	}

	private void waitForTrustedPreventsMessage(CommandEvent event, Message result) {

		waiter.waitForEvent(MessageReactionAddEvent.class,
				e -> (e.getChannel().equals(event.getChannel()) && Objects.equals(e.getMember(), event.getMember()) &&
						(e.getReactionEmote().getName().equals("\u2705") || e.getReactionEmote().getName().equals("\u274C"))),
				e -> {
					switch (e.getReactionEmote().getName()) {
						case "\u2705": //Yes
							db.updatePreventMessage(event, 1);
							staffMessages.setPreventMessage(event.getTextChannel(), true);
							result.delete().queue(null, ErrorManager.PERMISSION);
							break;
						case "\u274C": //No
							db.updatePreventMessage(event, 0);
							staffMessages.setPreventMessage(event.getTextChannel(), false);
							result.delete().queue(null, ErrorManager.PERMISSION);
							break;
					}
				}, 1, TimeUnit.MINUTES, () -> {
					result.delete().queue(null, ErrorManager.PERMISSION);
				});
	}


}
