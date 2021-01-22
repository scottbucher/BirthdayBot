import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { MessageUtils } from '../utils';

let Config = require('../../config/config.json');

export class FAQCommand implements Command {
    public name: string = 'faq';
    public aliases = [];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {
        let embed = new MessageEmbed()
            .setDescription(
                `View our FAQ for ${msg.client.user.toString()} [here](${Config.links.docs}/faq)!`
            )
            .setColor(Config.colors.default);

        await MessageUtils.send(channel, embed);
    }
}
