package me.stqlth.birthdaybot.commands.user;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.utils.EmbedSender;
import me.stqlth.birthdaybot.utils.ErrorManager;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.TextChannel;

import java.awt.*;

public class Shard extends Command {

    public Shard() {
        this.name = "shard";
        this.help = "View information about your shard.";
        this.guildOnly = true;
        this.category = new Category("Info");
    }

    @Override
    protected void execute(CommandEvent event) {

        int currentShard = event.getJDA().getShardInfo().getShardId() + 1;
        int totalShards = event.getJDA().getShardInfo().getShardTotal();

        String message = "You are currently on shard `" + currentShard + "` out of `" + totalShards + "` total shards!";
        EmbedSender.sendEmbed(event.getTextChannel(), null, message, Color.decode("#1CFE86"));
    }
}
