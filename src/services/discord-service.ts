import { Channel, Client, DiscordAPIError, TextChannel } from 'discord.js';

export class DiscordService {
    constructor(private client: Client) {}

    public async getTextChannel(guildId: string, channelId: string): Promise<TextChannel> {
        let channel: Channel;
        try {
            channel = await this.client.channels.fetch(channelId);
        } catch (error) {
            if (error instanceof DiscordAPIError && error.httpStatus === 404) return;
            throw error;
        }

        if (!(channel instanceof TextChannel && channel.guild.id === guildId)) return;

        return channel as TextChannel;
    }
}
