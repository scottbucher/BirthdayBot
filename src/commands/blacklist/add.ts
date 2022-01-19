import {
    ApplicationCommandData,
    CommandInteraction,
    GuildMember,
    PermissionString,
    Role,
    User,
} from 'discord.js';

import { EventData } from '../../models/index.js';
import { BlacklistRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { MessageUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class BlacklistAddSubCommand implements Command {
    constructor(public blacklistRepo: BlacklistRepo) {}
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('subCommands.add'),
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
        let mentionable = intr.options.getMentionable(Lang.getCom('arguments.roleOrUser'));

        if (
            !(mentionable instanceof User) &&
            !(mentionable instanceof GuildMember) &&
            !(mentionable instanceof Role)
        ) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed(
                    'validation',
                    'errorEmbeds.rawAPIInteractionDataReceived',
                    data.lang()
                )
            );
            return;
        }

        let blacklistData = await this.blacklistRepo.getBlacklist(intr.guild.id);

        if (blacklistData.blacklist.map(b => b.DiscordId).includes(mentionable.id)) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.alreadyInBlacklist', data.lang(), {
                    TYPE: Lang.getRef(
                        'info',
                        `types.${mentionable instanceof Role ? 'role' : 'user'}`,
                        data.lang()
                    ),
                })
            );
            return;
        }

        await this.blacklistRepo.addBlacklist(intr.guild.id, mentionable.id);

        await MessageUtils.sendIntr(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.blacklistAdd', data.lang(), {
                TARGET: mentionable.toString(),
            })
        );
    }
}
