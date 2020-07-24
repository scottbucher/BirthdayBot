import { FormatUtils, ParseUtils } from '../utils';
import { Message, TextChannel } from 'discord.js';

import { Command } from './command';
import { UserRepo } from '../services/database/repos';

let Config = require('../../config/config.json');

export class ListCommand implements Command {
    public name: string = 'list';
    public aliases = ['viewall'];
    public requireSetup = false;
    public guildOnly = true;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = true;

    constructor(private userRepo: UserRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let page = 1;

        if (args[1]) {
            try {
                page = ParseUtils.parseInt(args[1]);
            } catch (error) {
                // Not A Number
            }
            if (!page || page <= 0 || page > 100000) page = 1;
        }

        let pageSize = Config.birthdayListSize;

        let users = msg.guild.members.cache.filter(member => !member.user.bot).keyArray();

        let userDataResults = await this.userRepo.getBirthdayListFull(
            users,
            pageSize,
            page
        );

        if (page > userDataResults.stats.TotalPages) page = userDataResults.stats.TotalPages;

        let embed = await FormatUtils.getBirthdayListFullEmbed(
            msg.guild,
            userDataResults,
            page,
            pageSize
        );

        let message = await channel.send(embed);

        if (embed.description === '**No Birthdays in this server!**') return;

        if (page !== 1) await message.react(Config.emotes.previousPage);
        if (userDataResults.stats.TotalPages > page) await message.react(Config.emotes.nextPage);
    }
}
