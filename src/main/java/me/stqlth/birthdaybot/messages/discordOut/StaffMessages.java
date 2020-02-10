package me.stqlth.birthdaybot.messages.discordOut;

import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.getMethods.GetMessageInfo;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.*;

import java.awt.*;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.TimeUnit;

public class StaffMessages {
    private BirthdayBotConfig birthdayBotConfig;
    private GetMessageInfo getMessageInfo;

    public StaffMessages(BirthdayBotConfig birthdayBotConfig, GetMessageInfo getMessageInfo) {
        this.birthdayBotConfig = birthdayBotConfig;
        this.getMessageInfo = getMessageInfo;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //Punishment Command Messages
    public void sendErrorMessage(TextChannel channel, Member member, CommandEvent event, String command, String args) {
        SelfUser bot = event.getJDA().getSelfUser();
        String botIcon = bot.getAvatarUrl();
        Guild g = event.getGuild();
        EmbedBuilder builder = new EmbedBuilder();

        builder.setTitle("Invalid Usage!")
                .setAuthor(member.getUser().getName(), member.getUser().getAvatarUrl(), member.getUser().getAvatarUrl())
                .setColor(Color.decode("#EA2027"))
                .setDescription("Proper usage: " + birthdayBotConfig.getPrefix() + command + " " + args)
                .appendDescription("\n{} = Required, [] = Optional")
                .setFooter("© 2019 BirthdayBot", botIcon);
        channel.sendMessage(builder.build()).queue();
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    public void setPrefix(TextChannel channel, String prefix) {
        EmbedBuilder builder = new EmbedBuilder();

        builder.setColor(Color.decode("#34f922"))
                .setDescription("Successfully changed the bot prefix to `" + prefix + "`!");
        channel.sendMessage(builder.build()).queue();
    }
    public void prefixTooLarge(TextChannel channel) {
        EmbedBuilder builder = new EmbedBuilder();

        builder.setColor(Color.decode("#EA2027"))
                .setDescription("Your prefix can only be 100 characters long.");
        channel.sendMessage(builder.build()).complete().delete().queueAfter(15, TimeUnit.SECONDS);
    }
    public void onlyAdmins(TextChannel channel) {
        EmbedBuilder builder = new EmbedBuilder();

        builder.setColor(Color.decode("#EA2027"))
                .setDescription("Only Admins may use this command!");
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
