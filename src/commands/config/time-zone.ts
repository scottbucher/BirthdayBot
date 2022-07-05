import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, Message, PermissionString } from 'discord.js';

import { EventData } from '../../models/index.js';
import { GuildRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { CollectorUtils, FormatUtils, InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class TimezoneSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('settingType.timeZone'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = ['VIEW_CHANNEL'];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let timezone: string;
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;

        if (!reset) {
            // prompt them for a setting
            let _prompt = await InteractionUtils.send(
                intr,
                Lang.getEmbed('prompts', 'config.timezone', data.lang(), {
                    MENTION: intr.user.toString(),
                })
            );

            timezone = await CollectorUtils.collectByMessage(
                intr.channel,
                intr.user,
                async (nextMsg: Message) => {
                    if (FormatUtils.checkAbbreviation(nextMsg.content)) {
                        await InteractionUtils.send(
                            intr,
                            Lang.getErrorEmbed(
                                'validation',
                                'errorEmbeds.timezoneAbbreviation',
                                data.lang()
                            )
                        );
                        return;
                    }

                    let input = FormatUtils.findZone(nextMsg.content); // Try and get the time zone
                    if (!input) {
                        await InteractionUtils.send(
                            intr,
                            Lang.getErrorEmbed(
                                'validation',
                                'errorEmbeds.invalidTimezone',
                                data.lang()
                            )
                        );
                        return;
                    }

                    return input;
                },
                async () => {
                    await InteractionUtils.send(
                        intr,
                        Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                    );
                }
            );

            if (timezone === undefined) return;
        } else timezone = '0';

        if (timezone === 'clear') timezone = '0';

        await this.guildRepo.updateDefaultTimezone(intr.guild.id, timezone);

        await InteractionUtils.send(
            intr,
            timezone === '0'
                ? Lang.getSuccessEmbed('results', 'successEmbeds.defaultTimeCleared', data.lang())
                : Lang.getSuccessEmbed('results', 'successEmbeds.defaultTimeZoneSet', data.lang(), {
                      TIMEZONE: timezone,
                  })
        );
    }
}
