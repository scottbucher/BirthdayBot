import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';
import { createRequire } from 'node:module';

import { EventData } from '../../models/index.js';
import { CustomMessageRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { ListUtils, MessageUtils } from '../../utils/index.js';
import { Command } from '../index.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');

export class MessageListSubCommand implements Command {
    constructor(public customMessageRepo: CustomMessageRepo) {}
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('subCommands.list'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let page = intr.options.getInteger(Lang.getCom('arguments.page')) ?? 1;
        let type = intr.options.getString(Lang.getCom('arguments.type'))?.toLowerCase();
        let hasPremium = data.subscription ? data.subscription.service : false;

        let pageSize = Config.experience.birthdayMessageListSize;

        // Get the correct message list using logic based on the given type
        let customMessageResults =
            type === 'user_specific_birthday' || type === 'user_specific_member_anniversary'
                ? await this.customMessageRepo.getCustomMessageUserList(
                      intr.guild.id,
                      pageSize,
                      page,
                      type === 'user_specific_birthday' ? 'birthday' : 'member_anniversary'
                  )
                : await this.customMessageRepo.getCustomMessageList(
                      intr.guild.id,
                      pageSize,
                      page,
                      type
                  );

        if (page > customMessageResults.stats.TotalPages)
            page = customMessageResults.stats.TotalPages;

        let embed =
            type === 'user_specific_birthday' || type === 'user_specific_member_anniversary'
                ? await ListUtils.getCustomUserMessageListEmbed(
                      intr.guild,
                      customMessageResults,
                      page,
                      pageSize,
                      hasPremium,
                      type === 'user_specific_birthday' ? 'birthday' : 'member_anniversary',
                      data
                  )
                : await ListUtils.getCustomMessageListEmbed(
                      intr.guild,
                      customMessageResults,
                      page,
                      pageSize,
                      hasPremium,
                      type,
                      data
                  );

        await MessageUtils.sendIntr(intr, {
            embeds: [embed],
            components: [
                {
                    type: 'ACTION_ROW',
                    components: [
                        {
                            type: 'BUTTON',
                            customId: 'queue_previous_more',
                            emoji: Config.emotes.previousMore,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: 'queue_previous',
                            emoji: Config.emotes.previous,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: 'queue_refresh',
                            emoji: Config.emotes.refresh,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: 'queue_next',
                            emoji: Config.emotes.next,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: 'queue_next_more',
                            emoji: Config.emotes.nextMore,
                            style: 'PRIMARY',
                        },
                    ],
                },
            ],
        });
    }
}
