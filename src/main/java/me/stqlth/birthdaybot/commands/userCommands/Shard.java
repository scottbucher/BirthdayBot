package me.stqlth.birthdaybot.commands.userCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
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

        currentShard(event.getTextChannel(), currentShard, totalShards);
    }


    public void currentShard(TextChannel channel, int currentShard, int totalShards) {
        EmbedBuilder builder = new EmbedBuilder();

        builder.setColor(Color.decode("#2aff16"))
                .setDescription("You are currently on shard `" + currentShard + "` out of `" + totalShards + "` total shards!");
        channel.sendMessage(builder.build()).queue();
    }
}
