import { DMChannel, Message, TextChannel } from 'discord.js-light';

export interface Command {
    name: string;
    aliases: string[];
    requireSetup: boolean;
    guildOnly: boolean;
    adminOnly: boolean;
    ownerOnly: boolean;
    voteOnly: boolean;
    requirePremium: boolean;
    getPremium: boolean;
    execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel,
        hasPremium?: boolean
    ): Promise<void>;
}
