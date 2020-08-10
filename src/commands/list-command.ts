import * as Chrono from 'chrono-node';

import { FormatUtils, ParseUtils } from '../utils';
import { Message, TextChannel } from 'discord.js';

import { Command } from './command';
import { UserDataResults } from '../models/database';
import { UserRepo } from '../services/database/repos';
import moment from 'moment';

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
        let date: string;

        let input = args.slice(2).join(' ');

        if (input) {
            try {
                page = ParseUtils.parseInt(input);
            } catch (error) {
                // Not A Number
            }

            if (!page) date = await Chrono.parseDate(input); // Try an parse a date

            if (!page || page <= 0 || page > 100000) page = 1;
        }

        let pageSize = Config.birthdayListSize;

        let users = msg.guild.members.cache.filter(member => !member.user.bot).keyArray();

        let userDataResults: UserDataResults;

        if (date) {
            let input = moment(date).format('MM-DD');
            userDataResults = await this.userRepo.getBirthdayListFullFromDate(users, pageSize, input);
        } else {
            userDataResults = await this.userRepo.getBirthdayListFull(users, pageSize, page);
        }

        let embed = await FormatUtils.getBirthdayListFullEmbed(
            msg.guild,
            userDataResults,
            userDataResults.stats.Page,
            pageSize
        );

        let message = await channel.send(embed);

        if (embed.description === '**No Birthdays in this server!**') return;

        if (userDataResults.stats.Page !== 1) await message.react(Config.emotes.previousPage);
        if (userDataResults.stats.TotalPages > 1) await message.react(Config.emotes.jumpToPage);
        if (userDataResults.stats.TotalPages > page) await message.react(Config.emotes.nextPage);
    }
}
