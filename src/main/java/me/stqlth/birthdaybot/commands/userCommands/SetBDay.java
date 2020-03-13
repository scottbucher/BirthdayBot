package me.stqlth.birthdaybot.commands.userCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import com.jagrosh.jdautilities.commons.waiter.EventWaiter;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.events.message.react.MessageReactionAddEvent;
import net.dv8tion.jda.api.exceptions.InsufficientPermissionException;

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
        TextChannel textChannel = null;
        PrivateChannel privateChannel = null;

        try {
            textChannel = event.getTextChannel();
        } catch (IllegalStateException ignored) {
            privateChannel = event.getPrivateChannel();
        }
        boolean normal = true;

        if (privateChannel != null) normal = false;

        try {
            if (normal) event.getMessage().delete().queue();
        } catch (InsufficientPermissionException ignored) {}

        User author = event.getAuthor();

        String[] args = event.getMessage().getContentRaw().split(" ");

        if (args.length != 6) {
            if (normal) birthdayMessages.sendErrorMessage(Objects.requireNonNull(textChannel), getName(), getArguments());
            else birthdayMessages.sendErrorMessage(privateChannel, getName(), getArguments());
            return;
        }

        int offset = -1;

        try {
            offset = Integer.parseInt(args[5]);
        } catch (NumberFormatException e) {
            if (normal) birthdayMessages.invalidOffset(Objects.requireNonNull(textChannel)); else birthdayMessages.invalidOffset(privateChannel);
            return;
        }

        int utcTime = 0;

        if (offset > 14 || offset < -11) {
            if (normal) birthdayMessages.invalidOffset(Objects.requireNonNull(textChannel)); else birthdayMessages.invalidOffset(privateChannel);
            return;
        } else if (offset > 0) { //offset changes into the UTC time which is midnight for the user
            utcTime = 24 - offset;
        } else utcTime = Math.abs(offset);

        String offsetS = String.valueOf(offset);
        if (offsetS.equals("0")) {
            offsetS = "UTC";
        } else offsetS = "GMT" + offsetS;

        /*
        * Notes:
        * Now that I store user's birthday with their midnight in terms of UTC time
        * All I have to do is make a procedure which finds birthdays that are today //UNSURE
        * AND
        * Which have the current hour //UNSURE
        * EXAMPLES
        * Scenario 1: If user's birthday is January 1st with timezone -5
        * It is January 1st 5am - Birthday event triggered!
        * Scenario 2: If user's birthday is January 1st with timezone 7
        * It is December 31st 5pm - Birthday event triggered!
        */

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
            if (normal) birthdayMessages.invalidFormat(Objects.requireNonNull(textChannel), getName(), getArguments()); else birthdayMessages.invalidFormat(privateChannel, getName(), getArguments());
            return;
        }

        int age = -1;
        try { //try catch to check for invalid dates such as February 30th
            LocalDate birthDate = LocalDate.of(year, month, day);
            age = calculateAge(birthDate, LocalDate.now());
        } catch (Exception e) {
            if (normal) birthdayMessages.dateNotFound(Objects.requireNonNull(textChannel)); else birthdayMessages.dateNotFound(privateChannel);
            return;
        }

        if (age < 13) {
            if (normal) birthdayMessages.tooYoung(Objects.requireNonNull(textChannel)); else birthdayMessages.tooYoung(privateChannel);
            return;
        }

        String date = (normal ? getMonth(month) + " " + day + ", " + offsetS : getMonth(month) + " " + day + ", " + year+ " " + offsetS);

        if (offset == 13) offset = -11; //Easier conversion for storage
        if (offset == 14) offset = -10;

        if (offset > 0) { //Storing this birthday as a UTC time/date
            try {
                LocalDate birthDate = LocalDate.of(year, month, day);
                birthDate = birthDate.minusDays(1);
                year = birthDate.getYear();
                month = birthDate.getMonthValue();
                day = birthDate.getDayOfMonth();
            } catch (Exception e) {
                if (normal) birthdayMessages.dateNotFound(Objects.requireNonNull(textChannel)); else birthdayMessages.dateNotFound(privateChannel);
                return;
            }
        }

        String sBday = year + "-" + month + "-" + day;

        if (!db.doesUserExist(event.getAuthor())) {
            db.addUser(event.getAuthor());
        }
        int changesLeft = db.getChangesLeft(author);
        if (changesLeft  <= 0){
            if (normal) birthdayMessages.outOfChanges(Objects.requireNonNull(textChannel)); else birthdayMessages.outOfChanges(privateChannel);
            return;
        } else changesLeft--;

       if (normal) sendConfirmation(event, Objects.requireNonNull(textChannel), date, sBday, utcTime, changesLeft); else  sendConfirmation(event, privateChannel, date, sBday, utcTime, changesLeft);
    }

    public void sendConfirmation(CommandEvent event, TextChannel channel, String date, String sBday, int utcTime, int changesLeft) {
        EmbedBuilder builder = new EmbedBuilder();

        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("Please confirm that this is the correct date: **" + date + "**");
        channel.sendMessage(builder.build()).queue(result -> {
            result.addReaction("\u2705").queue();
            result.addReaction("\u274C").queue();
            waitForConfirmation(event, channel, result, sBday, utcTime, changesLeft, date);
        });
    }
    private void waitForConfirmation(CommandEvent event, TextChannel channel, Message msg, String sBday, int utcTime, int changesLeft, String date) {

        waiter.waitForEvent(MessageReactionAddEvent.class,
                e -> e.getChannel().equals(event.getChannel()) && !Objects.requireNonNull(e.getUser()).isBot() &&
                        ((e.getReactionEmote().getName().equals("\u2705") || e.getReactionEmote().getName().equals("\u274C")) && Objects.equals(e.getMember(), event.getMember())),
                e -> {
                    if (e.getReactionEmote().getName().equals("\u2705")) {

                        try {
                            msg.delete().queue();
                        } catch (InsufficientPermissionException ignored) {}

                        try {
                            db.updateBirthday(event.getMember().getUser(), sBday);
                            db.updateUTCTime(event, utcTime);
                            birthdayMessages.success(channel, date);
                        } catch (SQLException ex) {
                            birthdayMessages.invalidFormat(channel, getName(), getArguments());
                            return;
                        }
                        db.updateChangesLeft(event, changesLeft);

                    } else if (e.getReactionEmote().getName().equals("\u274C")) {
                        try {
                            msg.delete().queue();
                        } catch (InsufficientPermissionException ignored) {
                        }
                    }
                }, 30, TimeUnit.SECONDS, () -> {
                    try {
                        msg.delete().queue();
                    } catch (InsufficientPermissionException ignored) {}
                });
    }

    public void sendConfirmation(CommandEvent event, PrivateChannel channel, String date, String sBday, int utcTime, int changesLeft) {
        EmbedBuilder builder = new EmbedBuilder();

        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("Please confirm that this is the correct date: **" + date + "**");
        channel.sendMessage(builder.build()).queue(result -> {
            result.addReaction("\u2705").queue();
            result.addReaction("\u274C").queue();
            waitForConfirmation(event, channel, sBday, utcTime, changesLeft, date);
        });
    }
    private void waitForConfirmation(CommandEvent event, PrivateChannel channel, String sBday, int utcTime, int changesLeft, String date) {

        waiter.waitForEvent(MessageReactionAddEvent.class,
                e -> e.getChannel().equals(event.getChannel()) && !Objects.requireNonNull(e.getUser()).isBot() &&
                        ((e.getReactionEmote().getName().equals("\u2705") || e.getReactionEmote().getName().equals("\u274C")) && Objects.equals(e.getMember(), event.getMember())),
                e -> {
                    if (e.getReactionEmote().getName().equals("\u2705")) {
                        try {
                            db.updateBirthday(event.getAuthor(), sBday);
                            db.updateUTCTime(event, utcTime);
                            birthdayMessages.success(channel, date);
                        } catch (SQLException ex) {
                            birthdayMessages.invalidFormat(channel, getName(), getArguments());
                            return;
                        }
                        db.updateChangesLeft(event, changesLeft);
                    }
                });
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
