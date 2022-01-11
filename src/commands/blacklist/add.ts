import { APIInteractionDataResolvedGuildMember, APIRole } from 'discord-api-types';
import { CommandInteraction, GuildMember, Role, User } from 'discord.js';

import { EventData } from '../../models';
import { Lang } from '../../services';
import { BlacklistRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';

export class BlacklistAddSubCommand {
    constructor(public blacklistRepo: BlacklistRepo) {}

    public async execute(intr: CommandInteraction, data: EventData, reset: boolean): Promise<void> {
        let mentionable:
            | User
            | GuildMember
            | APIInteractionDataResolvedGuildMember
            | Role
            | APIRole = intr.options.getMentionable(Lang.getCom('arguements.roleOrUser'));

        if (
            !(mentionable instanceof User) &&
            !(mentionable instanceof GuildMember) &&
            !(mentionable instanceof Role)
        ) {
            Lang.getErrorEmbed(
                'validation',
                'errorEmbeds.rawAPIInteractionDataRecieved',
                data.lang()
            );
            return;
        }

        let blaklistData = await this.blacklistRepo.getBlacklist(intr.guild.id);

        if (blaklistData.blacklist.map(b => b.DiscordId).includes(mentionable.id)) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.alreadyBlacklisted', data.lang(), {
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
