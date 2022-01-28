import { Message, NewsChannel, TextBasedChannel, TextChannel } from 'discord.js';

export class GuildUtils {
    public static getMentionedTextChannel(msg: Message): TextBasedChannel {
        let textChannel = msg.mentions.channels
            .filter(c => c instanceof TextChannel || c instanceof NewsChannel)
            .first();

        if (textChannel) return textChannel;

        textChannel = msg.guild.channels.cache
            .filter(channel => channel instanceof TextChannel)
            .map(channel => channel as TextChannel)
            .find(channel => channel.name.toLowerCase().includes(msg.content.toLowerCase()));

        if (textChannel) return textChannel;

        return null;
    }
}
