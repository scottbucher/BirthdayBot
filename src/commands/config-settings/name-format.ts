import { CommandInteraction, Message } from 'discord.js';
import { EventData } from '../../models';
import { Lang } from '../../services';
import { GuildRepo } from '../../services/database/repos';
import { FormatUtils, MessageUtils } from '../../utils';
import { CollectorUtils } from '../../utils/collector-utils';

export class NameFormatSubCommand {
    constructor(public guildRepo: GuildRepo) {}

    public async execute(intr: CommandInteraction, data: EventData, reset: boolean): Promise<void> {
        let nameFormat: string;
        let guildMember = intr.guild.members.resolve(intr.user.id);
        if (!reset) {
            // prompt them for a setting
            let collect = CollectorUtils.createMsgCollect(intr.channel, intr.user, async () => {
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                );
            });

            let prompt = await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('prompts', 'config.nameFormat', data.lang(), {
                    MENTION: intr.user.toString(),
                    USERNAME: intr.user.username,
                    NICKNAME: guildMember.displayName,
                    TAG: `${intr.user.username}#${intr.user.discriminator}`,
                })
            );

            nameFormat = await collect(async (nextMsg: Message) => {
                let input = FormatUtils.extractNameFormatType(nextMsg.content);
                if (!input) {
                    await MessageUtils.sendIntr(
                        intr,
                        Lang.getErrorEmbed('validation', 'errorEmbeds.invalidSetting', data.lang())
                    );
                    return;
                }

                return input.toLowerCase();
            });
            if (nameFormat === undefined) return;
        } else nameFormat = 'default';

        if (nameFormat === 'default') nameFormat = 'mention';

        await this.guildRepo.updateNameFormat(intr.guild.id, nameFormat);

        await MessageUtils.sendIntr(
            intr,
            Lang.getEmbed('results', 'success.nameFormatSet', data.lang(), {
                SETTING: nameFormat,
                FORMAT:
                    nameFormat === 'mention'
                        ? intr.user.toString()
                        : nameFormat === 'nickname'
                        ? guildMember.displayName
                        : nameFormat === 'username'
                        ? intr.user.username
                        : `${intr.user.username}#${intr.user.discriminator}`,
            })
        );
    }
}
