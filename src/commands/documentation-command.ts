import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { MessageUtils } from '../utils';

let Config = require('../../config/config.json');

export class DocumentationCommand implements Command {
    public name: string = 'documentation';
    public aliases = ['docs', 'doc', 'wiki'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
        let embed = new MessageEmbed()
            .setDescription(
                `View our Documentation for ${msg.client.user.toString()} [here](https://birthdaybot.scottbucher.dev)!`
            )
            .setColor(Config.colors.default);

        if (channel instanceof TextChannel) await channel.send(embed);
        else MessageUtils.sendDm(channel, embed);
    }
}
