import { ButtonInteraction, Message } from 'discord.js';
import { createRequire } from 'node:module';

import { EventData } from '../models/internal-models.js';
import { UserRepo } from '../services/database/repos/index.js';
import { ButtonUtils, InteractionUtils, ListUtils, RegexUtils } from '../utils/index.js';
import { Button, ButtonDeferType } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class BirthdayListButton implements Button {
    public ids = [
        'birthday_list_previous',
        'birthday_list_next',
        'birthday_list_previous_more',
        'birthday_list_next_more',
        'birthday_list_refresh',
    ];
    public deferType = ButtonDeferType.UPDATE;
    public requireGuild = true;

    constructor(private userRepo: UserRepo) {}

    public async execute(intr: ButtonInteraction, msg: Message, data: EventData): Promise<void> {
        let embed = msg.embeds[0];

        let components = msg.components;
        components[0].components = components[0].components.map(c => c.setDisabled(true));

        await InteractionUtils.editReply(intr, {
            embeds: [embed],
            components: components,
        });

        let pageNum = RegexUtils.pageNumber(embed.title);
        if (pageNum === undefined) {
            return;
        }

        let newPageNum = ButtonUtils.getNewPageNum(
            pageNum,
            intr.customId.replace(/^birthday_list_/, '')
        );
        if (newPageNum === undefined) {
            return;
        }

        let guildMembers = intr.guild.members.cache;

        if (intr.guild.memberCount - guildMembers.size > 5) {
            guildMembers = await intr.guild.members.fetch();
        }

        let users = [...guildMembers.filter(member => !member.user.bot).keys()];

        let userData = await this.userRepo.getBirthdayListFull(
            users,
            Config.experience.birthdayListSize,
            newPageNum
        );

        let newEmbed = await ListUtils.getBirthdayListFullEmbed(
            intr.guild,
            userData,
            data.guild,
            userData.stats.Page,
            Config.experience.birthdayListSize,
            data
        );

        components[0].components = components[0].components.map(c => c.setDisabled(false));

        await InteractionUtils.editReply(intr, {
            embeds: [newEmbed],
            components: components,
        });
        return;
    }
}
