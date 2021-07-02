import { DMChannel, Message, TextChannel } from 'discord.js';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { MessageUtils } from '../utils';

export class UpdateCommand implements Command {
    public name: string = 'update';
    public aliases = ['poggers'];
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
        await MessageUtils.send(
            channel,
            Lang.getEmbed('info.update', LangCode.EN_US)
                .setAuthor('Birthday Bot', msg.client.user.avatarURL())
                .setThumbnail(msg.client.user.avatarURL())
        );
    }
}
