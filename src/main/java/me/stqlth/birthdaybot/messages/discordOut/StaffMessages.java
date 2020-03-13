package me.stqlth.birthdaybot.messages.discordOut;

import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.messages.getMethods.GetMessageInfo;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.exceptions.InsufficientPermissionException;

import java.awt.*;
import java.util.concurrent.TimeUnit;

public class StaffMessages {
    private GetMessageInfo getMessageInfo;

    public StaffMessages(GetMessageInfo getMessageInfo) {
        this.getMessageInfo = getMessageInfo;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //Punishment Command Messages

    public void sendErrorMessage(TextChannel channel, String command, String args) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#EA2027"))
                .setDescription("You forgot some parameters, try using this format:" +
                        "\nFormat: `bday " + command + " " + args + "`"
                        + "\nExample usage: `bday setrole @Birthdays`");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void sendMessageError(TextChannel channel, String command, String args) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#EA2027"))
                .setDescription("You forgot some parameters, try using this format:" +
                        "\nFormat: `bday " + command + " " + args + "`"
                        + "\nExample usage: `bday setmessage Happy Birthday!`");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void invalidTime(TextChannel channel, String command, String args) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#EA2027"))
                .setDescription("Invalid input, try using this format:" +
                        "\nFormat: `bday " + command + " " + args + "`"
                        + "\nExample usage: `bday config messageTime 15`");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void onlyAdmins(TextChannel channel) {
        EmbedBuilder builder = new EmbedBuilder();

        builder.setColor(Color.decode("#EA2027"))
                .setDescription("Only Admins may use this command!");
        channel.sendMessage(builder.build()).complete().delete().queueAfter(15, TimeUnit.SECONDS);
    }
    public void roleNotFound(TextChannel channel) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#EA2027"))
                .setDescription("The specified role cannot be found.");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void roleNotMentionable(TextChannel channel) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#EA2027"))
                .setDescription("The specified role is not mentionable. Please change this in your role settings.");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void messageTooLarge(TextChannel channel) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#EA2027"))
                .setDescription("That birthday message is too large.");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void successMessage(TextChannel channel, String message) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("Successfully set the birthday message to **" + message + "**");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void resetMessage(TextChannel channel) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("Successfully reset the birthday message to it's default value!");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void successMentionSetting(TextChannel channel, String setting) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("The birthday message will now mention @" + setting + "!");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void successRoleMentionSetting(TextChannel channel, Role setting) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("The birthday message will now mention " + setting.getAsMention() + "!");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void successMessageTime(TextChannel channel, int time) {
        String timeMessage;
        if (time == 0) timeMessage = "12:00 AM";
        else if (time > 0 && time < 12) timeMessage = time + ":00 AM";
        else timeMessage = (time-12) + ":00 PM";

        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("Successfully set the Birthday Messages to send at " + timeMessage);
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void disableMentionSetting(TextChannel channel) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("The birthday message will no longer mention anyone!");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void successChannel(TextChannel channel, TextChannel bdayChanbel) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("Successfully set the birthday channel to **" + bdayChanbel.getAsMention() + "**!");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void successChannelCreate(TextChannel channel, TextChannel bdayChanbel) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("Successfully created the birthday channel **" + bdayChanbel.getAsMention() + "**!");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void channelClear(TextChannel channel) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("**BirthdayBot** will no longer send birthday messages! :(");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void successBdayRole(TextChannel channel, Role bdayRole) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("Successfully set the birthday role to **" + bdayRole.getAsMention() + "**!");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void successBdayRoleCreate(TextChannel channel, Role bdayRole) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("Successfully created the birthday role **" + bdayRole.getAsMention() + "**!");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void bdayRoleClear(TextChannel channel) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("**BirthdayBot** will no longer give users the birthday role! :(");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void successTrustedRole(TextChannel channel, Role trustedRole) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("Successfully set the trusted role to **" + trustedRole.getAsMention() + "**!");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void successTrustedRoleCreate(TextChannel channel, Role trustedRole) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("Successfully created the trusted role **" + trustedRole.getAsMention() + "**!");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void trustedRoleClear(TextChannel channel) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("**BirthdayBot** will no longer look for a trusted role!");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void setPreventRole(TextChannel channel, boolean setting) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"));
                if (setting) builder.setDescription("**BirthdayBot** will only grant the birthday role with users with the trusted role now!");
                else builder.setDescription("**BirthdayBot** will grant the birthday role to all users regardless of if the user has the trusted role!");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void setPreventMessage(TextChannel channel, boolean setting) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"));
        if (setting) builder.setDescription("**BirthdayBot** will only send messages for users with the trusted role now!");
        else builder.setDescription("**BirthdayBot** will send birthday messages to all users regardless of if the user has the trusted role!");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void setPreventAge(TextChannel channel, boolean setting) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"));
        if (setting) builder.setDescription("**BirthdayBot** will no longer display a user's age!");
        else builder.setDescription("**BirthdayBot** will now show a user's age, use with caution.");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void botNoPerms(TextChannel channel) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setColor(Color.decode("#1CFE86"));
        builder.setDescription("**BirthdayBot** does not have enough permissions to do this!");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }









    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    public void setPrefix(TextChannel channel, String prefix) {
        EmbedBuilder builder = new EmbedBuilder();

        builder.setColor(Color.decode("#34f922"))
                .setDescription("Successfully changed the bot prefix to `" + prefix + "`!");
        try {
			channel.sendMessage(builder.build()).queue();
		} catch (InsufficientPermissionException ignored) {}
    }
    public void prefixTooLarge(TextChannel channel) {
        EmbedBuilder builder = new EmbedBuilder();

        builder.setColor(Color.decode("#EA2027"))
                .setDescription("Your prefix can only be 100 characters long.");
        channel.sendMessage(builder.build()).complete().delete().queueAfter(15, TimeUnit.SECONDS);
    }
    public void sendErrorMessagePrefix(TextChannel channel, Member member, CommandEvent event, String command) {
        SelfUser bot = event.getJDA().getSelfUser();
        String botIcon = bot.getAvatarUrl();
        Guild g = event.getGuild();
        EmbedBuilder builder = new EmbedBuilder();

        builder.setTitle("Invalid Usage!")
                .setAuthor(member.getUser().getName(), member.getUser().getAvatarUrl(), member.getUser().getAvatarUrl())
                .setColor(Color.decode("#EA2027"))
                .setDescription("Proper usage: " + getMessageInfo.getPrefix(g) + command + " <prefix>")
                .appendDescription("\n<> = Required, [] = Optional")
                .setFooter("© 2020 KryptoBot", botIcon);
        channel.sendMessage(builder.build()).complete().delete().queueAfter(15, TimeUnit.SECONDS);
    }

}
