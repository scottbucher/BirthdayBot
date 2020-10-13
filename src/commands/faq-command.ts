import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { MessageUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');

export class FAQCommand implements Command {
    public name: string = 'faq';
    public aliases = [];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
        let embed = new MessageEmbed()
            .setDescription(
                `View our FAQ for ${msg.client.user.toString()} [here](${Config.links.docs}/faq)!`
            )
            .setColor(Config.colors.default);

        await MessageUtils.send(channel, embed);
    }
}
