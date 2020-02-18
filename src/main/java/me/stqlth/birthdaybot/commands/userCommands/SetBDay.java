package me.stqlth.birthdaybot.commands.userCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import com.jagrosh.jdautilities.commons.waiter.EventWaiter;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Message;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.events.message.react.MessageReactionAddEvent;

import java.awt.*;
import java.sql.*;
import java.time.LocalDate;
import java.time.Period;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

public class SetBDay extends Command {
    private BirthdayMessages birthdayMessages;
    private EventWaiter waiter;
    private DatabaseMethods db;

    public SetBDay(BirthdayMessages birthdayMessages, EventWaiter waiter, DatabaseMethods databaseMethods) {
        this.name = "set";
        this.aliases = new String[]{"add"};
        this.guildOnly = false;
        this.help = "Sets a user's global birthday.";
        this.arguments = "<day>, <month>, <year>, <gmt offset>";
        this.category = new Category("Utilities");

        this.birthdayMessages = birthdayMessages;
        this.waiter = waiter;
        this.db = databaseMethods;
    }

    @Override
    protected void execute(CommandEvent event) {
        TextChannel channel = event.getTextChannel();
        event.getMessage().delete().queue();

        int changesLeft = db.getChangesLeft(event);
        if (changesLeft  <= 0) {
            birthdayMessages.outOfChanges(event, channel);
            return;
        } else changesLeft--;


        String[] args = event.getMessage().getContentRaw().split(" ");
        Guild g = event.getGuild();

        if (args.length != 6) {
            birthdayMessages.sendErrorMessage(channel, event, getName(), getArguments());
            return;
        }

        int offset = -1;

        try {
            offset = Integer.parseInt(args[5]);
        } catch (NumberFormatException e) {
            birthdayMessages.invalidOffset(channel);
            return;
        }

        if (offset > 14 || offset < -11) {
            birthdayMessages.invalidOffset(channel);
            return;
        }

        String offsetS = String.valueOf(offset);
        if (offsetS.equals("0")) {
            offsetS = "UTC";
        } else offsetS = "GMT" + offsetS;


        args[2] = args[2].replace(",", "");
        args[3] = args[3].replace(",", "");
        args[4] = args[4].replace(",", "");


        int day = -1;
        int month = -1;
        int year = -1;

        try {
            day = Integer.parseInt(args[2]);
            month = Integer.parseInt(args[3]);
            year = Integer.parseInt(args[4]);
        } catch (NumberFormatException e) {
            birthdayMessages.invalidFormat(channel, event, getName(), getArguments());
            return;
        }

        String sBday = args[4] + "-" + args[3] + "-" + args[2];

        int age = -1;
        try { //try catch to check for invalid dates such as February 30th
            LocalDate birthDate = LocalDate.of(year, month, day);
            age = calculateAge(birthDate, LocalDate.now());
        } catch (Exception e) {
            birthdayMessages.dateNotFound(channel);
            return;
        }

        if (age < 13) {
            birthdayMessages.tooYoung(channel);
            return;
        }

        String date = getMonth(month) + " " + day + ", " + year + " " + offsetS;

        sendConfirmation(event, channel, date, sBday, offset, changesLeft);
    }

    public void sendConfirmation(CommandEvent event, TextChannel channel, String date, String sBday, int offset, int changesLeft) {
        EmbedBuilder builder = new EmbedBuilder();

        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("Please confirm that this is the correct date: **" + date + "**");
        channel.sendMessage(builder.build()).queue(result -> {
            result.addReaction("\u2705").queue();
            result.addReaction("\u274C").queue();
            waitForConfirmation(event, channel, result, sBday, offset, changesLeft, date);
        });
    }
    private void waitForConfirmation(CommandEvent event, TextChannel channel, Message msg, String sBday, int offset, int changesLeft, String date) {

        waiter.waitForEvent(MessageReactionAddEvent.class,
                e -> e.getChannel().equals(event.getChannel()) && !Objects.requireNonNull(e.getUser()).isBot() &&
                        ((e.getReactionEmote().getName().equals("\u2705") || e.getReactionEmote().getName().equals("\u274C")) && Objects.equals(e.getMember(), event.getMember())),
                e -> {
                    if (e.getReactionEmote().getName().equals("\u2705")) {
                        msg.delete().queue();

                        try {
                            db.updateBirthday(event, sBday);
                            db.updateOffset(event, offset);
                            birthdayMessages.success(channel, date);
                        } catch (SQLException ex) {
                            birthdayMessages.invalidFormat(channel, event, getName(), getArguments());
                            return;
                        }
                        db.updateChangesLeft(event, changesLeft);

                    } else if (e.getReactionEmote().getName().equals("\u274C")) {
                        msg.delete().queue();
                    }
                }, 30, TimeUnit.SECONDS, () -> msg.delete().queue());
    }

    private static int calculateAge(LocalDate birthDate, LocalDate currentDate) {
        if ((birthDate != null) && (currentDate != null)) {
            return Period.between(birthDate, currentDate).getYears();
        } else {
            return 0;
        }
    }
    private static String getMonth(int month) {
        switch (month) {
            case 1:  return "January";
            case 2:  return "February";
            case 3:  return "March";
            case 4:  return "April";
            case 5:  return "May";
            case 6:  return "June";
            case 7:  return "July";
            case 8:  return "August";
            case 9:  return "September";
            case 10: return "October";
            case 11: return "November";
            case 12: return "December";
            default: return "Invalid month";
        }
    }

}
