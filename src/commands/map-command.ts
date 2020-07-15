import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { MessageUtils } from '../utils';

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
    public voteOnly = false;

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
        let embed = new MessageEmbed()
            .setDescription(
                '[Kevin Novak](https://github.com/KevinNovak) has created a handy [map time zone picker](https://kevinnovak.github.io/Time-Zone-Picker/)!' +
                    '\n' +
                    '\nSimply click your location on the map and copy the name of the selected time zone. You can then use it in the `bday set` command.'
            )
            .setColor(Config.colors.default);

        if (channel instanceof TextChannel) await channel.send(embed);
        else MessageUtils.sendDm(channel, embed);
    }
}
