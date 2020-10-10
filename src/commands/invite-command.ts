import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { MessageUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');

export class InviteCommand implements Command {
    public name: string = 'invite';
    public aliases = ['inv'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;

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
