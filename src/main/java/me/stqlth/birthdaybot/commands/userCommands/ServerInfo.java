package me.stqlth.krypto.commands.user;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import com.mashape.unirest.http.Unirest;
import me.stqlth.krypto.messages.getMethods.GetMessageInfo;
import me.stqlth.krypto.music.FormatTime;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.OnlineStatus;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.SelfUser;
import net.dv8tion.jda.api.entities.TextChannel;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class ServerInfo extends Command {

    private GetMessageInfo getMessageInfo;
    public ServerInfo(GetMessageInfo getMessageInfo) {
        this.name = "serverinfo";
        this.help = "View information about your server.";
        this.guildOnly = true;
        this.category = new Category("Info");

        this.getMessageInfo = getMessageInfo;
    }

    @Override
    protected void execute(CommandEvent event) {

        if (event.getMember().getUser().isBot()) return;

        EmbedBuilder builder = new EmbedBuilder();
        Guild guild = event.getGuild();
        FormatTime ft = new FormatTime();

        int currentShard = event.getJDA().getShardInfo().getShardId() + 1;
        int totalShards = event.getJDA().getShardInfo().getShardTotal();

        List<Member> totalMembers = event.getGuild().getMembers();
        ArrayList<Member> totalRealMembers = new ArrayList<>();
        ArrayList<Member> totalBots = new ArrayList<>();

        for (Member member : totalMembers) {
            if (!member.getUser().isBot()) {
                totalRealMembers.add(member);
                continue;
            }
            totalBots.add(member);
        }

        ArrayList<Member> onlineMembers = new ArrayList<>();

        for (Member member : totalRealMembers) {
            OnlineStatus status = member.getOnlineStatus();
            if (status == OnlineStatus.ONLINE || status == OnlineStatus.DO_NOT_DISTURB)
                onlineMembers.add(member);
        }


        SelfUser bot = event.getJDA().getSelfUser();
        TextChannel channel = event.getTextChannel();
        String month = guild.getTimeCreated().getMonth().toString().toLowerCase();
        String uMonth = month.substring(0, 1).toUpperCase() + month.substring(1);

        builder.setAuthor(guild.getName(), null, guild.getIconUrl())
                .setColor(getAverageColor(event.getMember().getUser().getAvatarUrl()))
                .addField("Member Count", "" + totalRealMembers.size() + " (" + onlineMembers.size() + " currently online)", true)
                .addField("Bot Count", "" + totalBots.size(), true)
                .addField("Channel Count", guild.getTextChannels().size() + " text channels\n"
                        + guild.getVoiceChannels().size() + " voice channels", true)
                .addField("Guild Specific Prefix", "`" + getMessageInfo.getPrefix(guild) + "`", true)
                .addField("Server Founder", Objects.requireNonNull(guild.getOwner()).getUser().getAsTag(), true)
                .addField("Created On", uMonth + " " + guild.getTimeCreated().getDayOfMonth()
                        + getDayEnding(guild) + " " + guild.getTimeCreated().getYear(), true)
                .addField("Discord Id", guild.getId(), true)
                .addField("Current Shard", "shard " + currentShard + "/" + totalShards + " total shards", true)
                .setThumbnail(bot.getAvatarUrl())
                .setFooter(bot.getName(), bot.getAvatarUrl());

        channel.sendMessage(builder.build()).queue();


    }


    private static String getDayEnding(Guild guild) {
        if (guild.getTimeCreated().getDayOfMonth() > 10) {
            if (guild.getTimeCreated().getDayOfMonth() % 10 == 1)
                return "st";
            else if (guild.getTimeCreated().getDayOfMonth() % 10 == 2)
                return "nd";
            else if (guild.getTimeCreated().getDayOfMonth() % 10 == 3)
                return "rd";
            else return "th";
        } else if (guild.getTimeCreated().getDayOfMonth() == 1)
            return "st";
        else if (guild.getTimeCreated().getDayOfMonth() == 2)
            return "nd";
        else if (guild.getTimeCreated().getDayOfMonth() == 3)
            return "rd";
        else return "th";
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



}



