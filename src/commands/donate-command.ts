import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { MessageUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');

export class DonateCommand implements Command {
    public name: string = 'donate';
    public aliases = ['donations', 'contribute'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
        let embed = new MessageEmbed()
            .setDescription(
                `You can support ${msg.client.user.toString()} by donating [here](${
                    Config.links.donate
                })!`
            )
            .setColor(Config.colors.default);

        await MessageUtils.send(channel, embed);
    }
}
