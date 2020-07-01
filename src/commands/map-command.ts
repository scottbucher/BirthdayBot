import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { MessageUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');

export class MapCommand implements Command {
    public name: string = 'map';
    public aliases = [
        'timezonemap',
        'tzmap',
        'tz',
        'timezones',
        'timezone',
        'time-zone-map',
        'tz-map',
    ];
    public requireSetup = false;
    public guildOnly: boolean = false;
    public adminOnly: boolean = false;
    public ownerOnly: boolean = false;

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
        let embed = new MessageEmbed()
            .setDescription(
                `Find your timezone [here](https://birthdaybot.scottbucher.dev/faq#why-does-birthday-bot-need-my-timezone)!`
            )
            .setColor(Config.colors.default);

        if (channel instanceof TextChannel) await channel.send(embed);
        else MessageUtils.sendDm(channel, embed);
    }
}
