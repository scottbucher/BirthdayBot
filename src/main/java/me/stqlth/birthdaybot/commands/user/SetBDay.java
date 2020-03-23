package me.stqlth.birthdaybot.commands.userCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import com.jagrosh.jdautilities.commons.waiter.EventWaiter;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;
import me.stqlth.birthdaybot.utils.DatabaseMethods;
import me.stqlth.birthdaybot.utils.Logger;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.events.message.react.MessageReactionAddEvent;
import net.dv8tion.jda.api.exceptions.InsufficientPermissionException;
import org.json.JSONArray;

import java.awt.*;
import java.sql.SQLException;
import java.text.BreakIterator;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

public class SetBDay extends Command {
    private BirthdayMessages birthdayMessages;
    private EventWaiter waiter;
    private DatabaseMethods db;
    private JSONArray regions;

    public SetBDay(BirthdayMessages birthdayMessages, EventWaiter waiter, DatabaseMethods databaseMethods, BirthdayBotConfig birthdayBotConfig) {
        this.name = "set";
        this.aliases = new String[]{"add"};
        this.guildOnly = false;
        this.help = "Sets a user's global birthday.";
        this.arguments = "<day>, <month>, <year>, <gmt offset>";
        this.category = new Category("Utilities");

        this.birthdayMessages = birthdayMessages;
        this.waiter = waiter;
        this.db = databaseMethods;
        this.regions = birthdayBotConfig.getRegions();
    }
    @Override
    protected void execute(CommandEvent event) {
        TextChannel textChannel = null;
        PrivateChannel privateChannel = null;

        try {
            textChannel = event.getTextChannel();
        } catch (IllegalStateException ex) {
            privateChannel = event.getPrivateChannel();
        }
        boolean normal = privateChannel == null;

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

        List<String> acceptedZones = new ArrayList<>();
        for (String check : ZoneId.getAvailableZoneIds()) {
            for (Object region : regions) {
                if (check.startsWith(region.toString())) {
                    acceptedZones.add(check);
                    break;
                }
            }
        }

        boolean check = false;
        for (String acceptedZone : acceptedZones)
            if (args[5].equalsIgnoreCase(acceptedZone)) {
                check = true;
                break;
            }
        if (!check) {
            if (normal) birthdayMessages.invalidZone(Objects.requireNonNull(textChannel)); else birthdayMessages.invalidZone(privateChannel);
            return;
        }

        ZoneId zoneId;
        try {
            zoneId = ZoneId.of(args[5]);
        } catch (DateTimeException e) {
            if (normal) birthdayMessages.invalidZone(Objects.requireNonNull(textChannel)); else birthdayMessages.invalidZone(privateChannel);
            return;
        }

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

        String date = (normal ? getMonth(month) + " " + day + ", " + zoneId.toString() : getMonth(month) + " " + day + ", " + year + ", " + zoneId.toString());

        String sBday = year + "-" + month + "-" + day;

        if (!db.doesUserExist(event.getAuthor())) {
            db.addUser(event.getAuthor());
        }
        int changesLeft = db.getChangesLeft(author);
        if (changesLeft  <= 0){
            if (normal) birthdayMessages.outOfChanges(Objects.requireNonNull(textChannel)); else birthdayMessages.outOfChanges(privateChannel);
            return;
        } else changesLeft--;

        if (normal) sendConfirmation(event, Objects.requireNonNull(textChannel), date, sBday, zoneId.toString(), changesLeft); else  sendConfirmation(event, privateChannel, date, sBday, zoneId.toString(), changesLeft);

    }

    public void sendConfirmation(CommandEvent event, TextChannel channel, String date, String sBday, String zoneId, int changesLeft) {
        EmbedBuilder builder = new EmbedBuilder();

        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("Please confirm that this is the correct date: **" + date + "**");
        channel.sendMessage(builder.build()).queue(result -> {
            result.addReaction("\u2705").queue();
            result.addReaction("\u274C").queue();
            waitForConfirmation(event, channel, result, sBday, zoneId, changesLeft, date);
        });
    }
    private void waitForConfirmation(CommandEvent event, TextChannel channel, Message msg, String sBday, String zoneId, int changesLeft, String date) {

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
                            db.updateZoneId(event, zoneId);
                            birthdayMessages.success(channel, date);
                        } catch (SQLException ex) {
                            Logger.Info("Here");
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

    public void sendConfirmation(CommandEvent event, PrivateChannel channel, String date, String sBday, String zoneId, int changesLeft) {
        EmbedBuilder builder = new EmbedBuilder();

        builder.setColor(Color.decode("#1CFE86"))
                .setDescription("Please confirm that this is the correct date: **" + date + "**");
        channel.sendMessage(builder.build()).queue(result -> {
            result.addReaction("\u2705").queue();
            result.addReaction("\u274C").queue();
            waitForConfirmation(event, channel, result, sBday, zoneId, changesLeft, date);
        });
    }
    private void waitForConfirmation(CommandEvent event, PrivateChannel channel, Message msg, String sBday, String zoneId, int changesLeft, String date) {

        waiter.waitForEvent(MessageReactionAddEvent.class,
                e -> e.getChannel().equals(event.getChannel()) && !Objects.requireNonNull(e.getUser()).isBot() &&
                        ((e.getReactionEmote().getName().equals("\u2705") || e.getReactionEmote().getName().equals("\u274C")) && Objects.equals(e.getMember(), event.getMember())),
                e -> {
                    if (e.getReactionEmote().getName().equals("\u2705")) {
                        try {
                            db.updateBirthday(event.getAuthor(), sBday);
                            db.updateZoneId(event, zoneId);
                            msg.delete().queue();
                            birthdayMessages.success(channel, date);
                        } catch (SQLException ex) {
                            birthdayMessages.invalidFormat(channel, getName(), getArguments());
                            return;
                        }
                        db.updateChangesLeft(event, changesLeft);
                    } else if (e.getReactionEmote().getName().equals("\u274C")) msg.delete().queue();
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
