import {
    CommandInteraction,
    GuildChannel,
    NewsChannel,
    TextChannel,
    ThreadChannel,
} from 'discord.js';
import { createRequire } from 'node:module';

import { Command } from '../commands/index.js';
import { Permission } from '../models/enum-helpers/index.js';
import { EventData } from '../models/internal-models.js';
import { Lang } from '../services/index.js';
import { FormatUtils, InteractionUtils, TimeUtils } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
export class CommandUtils {
    public static findCommand(commands: Command[], input: string): Command {
        return commands.find(command => command.metadata.name === input);
    }

    public static async runChecks(
        command: Command,
        intr: CommandInteraction,
        data: EventData
    ): Promise<boolean> {
        if (command.cooldown) {
            let limited = command.cooldown.take(intr.user.id);
            if (limited) {
                await InteractionUtils.send(
                    intr,
                    Lang.getErrorEmbed('validation', 'errorEmbeds.cooldownHit', data.lang(), {
                        AMOUNT: command.cooldown.amount.toLocaleString(),
                        INTERVAL: FormatUtils.duration(command.cooldown.interval, data.lang()),
                    })
                );
                return false;
            }
        }

        switch (true) {
            case !intr.inGuild(): {
                return true;
            }
            case intr.channel instanceof TextChannel || intr.channel instanceof NewsChannel: {
                // Check if command requires guild setup
                if (command.requireSetup && !data.guild) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getEmbed('validation', 'embeds.setupRequired', data.lang())
                    );
                    return false;
                }

                // Check if the bot has all the required client permissions for this command
                if (
                    (intr.channel instanceof GuildChannel ||
                        intr.channel instanceof ThreadChannel) &&
                    !intr.channel.permissionsFor(intr.client.user).has(command.requireClientPerms)
                ) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getEmbed('validation', 'embeds.missingClientPerms', data.lang(), {
                            PERMISSIONS: command.requireClientPerms
                                .map(
                                    perm => `**${Permission.Data[perm].displayName(data.lang())}**`
                                )
                                .join(', '),
                        })
                    );
                    return false;
                }

                // Check if command requires premium
                if (
                    Config.payments.enabled &&
                    command.requirePremium &&
                    !data.subscription?.service
                ) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getEmbed('validation', 'embeds.premiumRequired', data.lang(), {
                            ICON: intr.client.user.displayAvatarURL(),
                        })
                    );
                    return false;
                }

                // Check if user needs to vote
                if (Config.voting.enabled && command.requireVote && !data.subscription?.service) {
                    let voteTime = TimeUtils.getMoment(data.vote?.VoteTime);
                    if (
                        !voteTime ||
                        TimeUtils.now() >= voteTime.clone().add(Config.voting.hours, 'hours')
                    ) {
                        let voteTimeAgo = voteTime?.fromNow() ?? 'Never';

                        await InteractionUtils.send(
                            intr,
                            Lang.getEmbed('validation', 'embeds.voteRequired', data.lang(), {
                                LAST_VOTE: voteTimeAgo,
                                ICON: intr.client.user.displayAvatarURL(),
                            })
                        );
                        return false;
                    }
                }

                return true;
            }
            default: {
                return false;
            }
        }
    }
}
