import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, PermissionString, Role } from 'discord.js';

import { EventData } from '../../models/index.js';
import { GuildRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { ClientUtils } from '../../utils/client-utils.js';
import { FormatUtils } from '../../utils/format-utils.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class MessageSettingMentionSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('subCommands.mention'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        // gets the type which is either BIRTHDAY, MEMBER_ANNIVERSARY, or SERVER_ANNIVERSARY
        let type = intr.options.getString(Lang.getCom('arguments.type')).toLowerCase();

        let mention = intr.options.getString(Lang.getCom('arguments.mention')).toLowerCase();

        // Find mentioned role
        let roleInput: Role = await ClientUtils.findRole(intr.guild, mention);

        if (!roleInput || roleInput.guild.id !== intr.guild.id) {
            // if there is no roles then check for other accepted values
            if (
                mention !== 'everyone' &&
                mention !== 'here' &&
                mention !== '@here' &&
                mention !== 'none'
            ) {
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('validation', 'embeds.invalidMentionSetting', data.lang(), {
                        ICON: intr.client.user.displayAvatarURL(),
                    })
                );
                return;
            } else {
                if (mention === '@here') {
                    // Support for the @here input
                    mention = `here`;
                }
            }
        } else {
            mention = roleInput?.id; // If roleInput does exists then get the role Id
        }

        let mentionOutput: string;

        if (!roleInput || roleInput.guild.id !== intr.guild.id) {
            if (mention.toLowerCase() === 'everyone' || mention.toLowerCase() === 'here') {
                mentionOutput = '@' + mention;
            } else if (mention.toLowerCase() === 'none') {
                mentionOutput = Lang.getRef('info', 'terms.noOne', data.lang());
            }
        } else {
            mentionOutput = roleInput.toString();
        }

        let displayType = FormatUtils.getCelebrationDisplayType(type.replaceAll('_', ''), false);

        if (mention === 'none') mention = '0';

        type === 'birthday'
            ? await this.guildRepo.updateBirthdayMentionSetting(intr.guild.id, mention)
            : type === 'member_anniversary'
            ? await this.guildRepo.updateMemberAnniversaryMentionSetting(intr.guild.id, mention)
            : await this.guildRepo.updateServerAnniversaryMentionSetting(intr.guild.id, mention);

        await InteractionUtils.send(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.setMessageMention', data.lang(), {
                BOT: intr.client.user.toString(),
                MENTION: mentionOutput,
                DISPLAY_TYPE: displayType,
            })
        );
    }
}
