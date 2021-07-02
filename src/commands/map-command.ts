import { DMChannel, Message, TextChannel } from 'discord.js';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { MessageUtils } from '../utils';

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
    public requirePremium = false;
    public getPremium = false;

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {
        await MessageUtils.send(channel, Lang.getEmbed('info.map', LangCode.EN_US));
    }
}
