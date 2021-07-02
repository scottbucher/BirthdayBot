import { DMChannel, Message, TextChannel } from 'discord.js';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { MessageUtils, FormatUtils } from '../utils';

export class HelpCommand implements Command {
    public name: string = 'help';
    public aliases = ['?'];
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
        let clientAvatarUrl = msg.client.user.avatarURL();

        let option = FormatUtils.extractMiscActionType(args[2]?.toLowerCase())?.toLowerCase();
        if (!option) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('help.general', LangCode.EN_US).setAuthor(
                    'ADD AUTHORS KEVIN >:(',
                    clientAvatarUrl
                )
            );
        } else if (option === 'setup') {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('help.setup', LangCode.EN_US).setAuthor(
                    'ADD AUTHORS KEVIN >:(',
                    clientAvatarUrl
                )
            );
        } else if (option === 'message') {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('help.message', LangCode.EN_US).setAuthor(
                    'ADD AUTHORS KEVIN >:(',
                    clientAvatarUrl
                )
            );
        } else if (option === 'trusted') {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('help.trusted', LangCode.EN_US).setAuthor(
                    'ADD AUTHORS KEVIN >:(',
                    clientAvatarUrl
                )
            );
        } else if (option === 'blacklist') {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('help.blacklist', LangCode.EN_US).setAuthor(
                    'ADD AUTHORS KEVIN >:(',
                    clientAvatarUrl
                )
            );
        } else if (option === 'premium') {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('help.premium', LangCode.EN_US).setAuthor(
                    'ADD AUTHORS KEVIN >:(',
                    clientAvatarUrl
                )
            );
        } else {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('help.general', LangCode.EN_US).setAuthor(
                    'ADD AUTHORS KEVIN >:(',
                    clientAvatarUrl
                )
            );
        }
    }
}
