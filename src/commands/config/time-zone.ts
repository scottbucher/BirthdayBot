import { ApplicationCommandData, CommandInteraction, Message, PermissionString } from 'discord.js';

import { EventData } from '../../models/index.js';
import { GuildRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { CollectorUtils, FormatUtils, InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class TimezoneSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('settingType.timeZone'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = ['VIEW_CHANNEL'];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let timezone: string;
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;

        if (!reset) {
            // prompt them for a setting
            let collect = CollectorUtils.createMsgCollect(intr.channel, intr.user, async () => {
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                );
            });

            let _prompt = await InteractionUtils.send(
                intr,
                Lang.getEmbed('prompts', 'config.timezone', data.lang(), {
                    MENTION: intr.user.toString(),
                })
            );

            timezone = await collect(async (nextMsg: Message) => {
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
                        Lang.getErrorEmbed('validation', 'errorEmbeds.invalidTimezone', data.lang())
                    );
                    return;
                }

                return input;
            });
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
