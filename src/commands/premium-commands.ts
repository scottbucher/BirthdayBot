import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { MessageUtils } from '../utils';

let Config = require('../../config/config.json');

export class PremiumCommand implements Command {
    public name: string = 'premium';
    public aliases = ['inv'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
        let embed = new MessageEmbed()
            .setDescription(
                `Invite ${msg.client.user.toString()} to your server [here](${
                    Config.links.invite
                })!`
            )
            .setColor(Config.colors.default);

        await MessageUtils.send(channel, embed);
    }
}
