import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, Message, PermissionString } from 'discord.js';

import { EventData } from '../../models/index.js';
import { GuildRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { CollectorUtils, FormatUtils, InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class UseTimezoneSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('settingType.useTimezone'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = ['VIEW_CHANNEL'];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;
        let useTimezone: string;

        if (!reset) {
            // prompt them for a setting
            let _prompt = await InteractionUtils.send(
                intr,
                Lang.getEmbed('prompts', 'config.useTimezone', data.lang())
            );

            useTimezone = await CollectorUtils.collectByMessage(
                intr.channel,
                intr.user,
                async (nextMsg: Message) => {
                    let input =
                        FormatUtils.extractMiscActionType(nextMsg.content)?.toLowerCase() ?? '';

                    if (input !== 'user' && input !== 'server') {
                        await InteractionUtils.send(
                            intr,
                            Lang.getErrorEmbed(
                                'validation',
                                'errorEmbeds.invalidSetting',
                                data.lang()
                            )
                        );
                        return;
                    }

                    return input.toLowerCase();
                },
                async () => {
                    await InteractionUtils.send(
                        intr,
                        Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                    );
                }
            );

            if (useTimezone === undefined) return;
        } else useTimezone = 'server';

        await this.guildRepo.updateUseTimezone(intr.guild.id, useTimezone);
        await InteractionUtils.send(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.useTimeZoneSettingSet', data.lang(), {
                OPTION: useTimezone,
            })
        );
    }
}
