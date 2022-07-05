import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, PermissionString } from 'discord.js';
import { createRequire } from 'node:module';

import { EventData } from '../../models/index.js';
import { CustomMessageRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils, ListUtils } from '../../utils/index.js';
import { Command } from '../index.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');

export class MessageListSubCommand implements Command {
    constructor(public customMessageRepo: CustomMessageRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('subCommands.list'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let page = intr.options.getInteger(Lang.getCom('arguments.page')) ?? 1;
        let type = intr.options.getString(Lang.getCom('arguments.type'))?.toLowerCase();

        let databaseType = type.replaceAll('_', ''); // How we store the type in the database, for instance, memberanniversary
        if (databaseType.includes('specific'))
            databaseType = databaseType.includes('birthday') ? 'birthday' : 'memberanniversary';

        let pageSize = Config.experience.messageListSize;

        // Get the correct message list using logic based on the given type
        let customMessageResults =
            type === 'user_specific_birthday' || type === 'user_specific_member_anniversary'
                ? await this.customMessageRepo.getCustomMessageUserList(
                      intr.guild.id,
                      pageSize,
                      page,
                      databaseType
                  )
                : await this.customMessageRepo.getCustomMessageList(
                      intr.guild.id,
                      pageSize,
                      page,
                      databaseType
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
                      type === 'user_specific_birthday' ? 'birthday' : 'member_anniversary',
                      data
                  )
                : await ListUtils.getCustomMessageListEmbed(
                      intr.guild,
                      customMessageResults,
                      page,
                      pageSize,
                      type,
                      data
                  );

        await InteractionUtils.send(intr, {
            embeds: [embed],
            components: [
                {
                    type: 'ACTION_ROW',
                    components: [
                        {
                            type: 'BUTTON',
                            customId: type + '_message_previous_more',
                            emoji: Config.emotes.previousMore,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: type + '_message_previous',
                            emoji: Config.emotes.previous,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: type + '_message_refresh',
                            emoji: Config.emotes.refresh,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: type + '_message_next',
                            emoji: Config.emotes.next,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: type + '_message_next_more',
                            emoji: Config.emotes.nextMore,
                            style: 'PRIMARY',
                        },
                    ],
                },
            ],
        });
    }
}
