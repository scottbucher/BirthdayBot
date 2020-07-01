import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { MessageUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');

export class SupportCommand implements Command {
    public name: string = 'support';
    public aliases = ['supportserver', 'server'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
        let embed = new MessageEmbed()
            .setDescription(
                `For support join our discord server [here](https://discord.gg/9gUQFtz)!`
            )
            .setColor(Config.colors.default);

        if (channel instanceof TextChannel) await channel.send(embed);
        else MessageUtils.sendDm(channel, embed);
    }
}
