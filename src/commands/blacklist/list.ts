import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';
import { createRequire } from 'node:module';

import { EventData } from '../../models/index.js';
import { BlacklistRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { ListUtils, MessageUtils } from '../../utils/index.js';
import { Command } from '../index.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');

export class BlacklistListSubCommand implements Command {
    constructor(public blacklistRepo: BlacklistRepo) {}
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

        let pageSize = Config.experience.blacklistSize;

        let blacklistResults = await this.blacklistRepo.getBlacklistList(
            intr.guild.id,
            pageSize,
            page
        );

        if (page > blacklistResults.stats.TotalPages) page = blacklistResults.stats.TotalPages;

        let embed = await ListUtils.getBlacklistFullEmbed(
            intr.guild,
            blacklistResults,
            page,
            pageSize,
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
