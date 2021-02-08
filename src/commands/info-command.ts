import { DMChannel, Message, TextChannel } from 'discord.js';

import { LangCode } from '../models/enums';
import { Lang } from '../services';
import { MessageUtils } from '../utils';
import { Command } from './command';

export class InfoCommand implements Command {
    public name: string = 'info';
    public aliases = ['information'];
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
        await MessageUtils.send(msg.channel, Lang.getEmbed('info.general', LangCode.EN_US));
    }
}
