import {
    CommandInteraction,
    DMChannel,
    GuildChannel,
    GuildMember,
    NewsChannel,
    Permissions,
    TextChannel,
} from 'discord.js';

import { MessageUtils, TimeUtils } from '.';
import { Command } from '../commands';
import { Permission } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';

let Config = require('../../config/config.json');
let Debug = require('../../config/debug.json');

export class CommandUtils {
    public static async runChecks(
        command: Command,
        intr: CommandInteraction,
        data: EventData
    ): Promise<boolean> {
        // Check if this command is a developer only command
        if (command.requireDev && !Config.developers.includes(intr.user.id)) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.devOnlyCommand', data.lang())
            );
            return false;
        }

        // Check if this command is a guild only command
        if (command.requireGuild && !intr.guild) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.serverOnlyCommand', data.lang())
            );
            return false;
        }

        switch (true) {
            case intr.channel instanceof DMChannel: {
                return true;
            }
            case intr.channel instanceof TextChannel || intr.channel instanceof NewsChannel: {
                // Check if command requires guild setup
                if (command.requireSetup && !data.guild) {
                    await MessageUtils.sendIntr(
                        intr,
                        Lang.getEmbed('validation', 'embeds.setupRequired', data.lang())
                    );
                    return false;
                }

                // Check if the bot has all the required client permissions for this command
                if (
                    intr.channel instanceof GuildChannel &&
                    !intr.channel.permissionsFor(intr.client.user).has(command.requireClientPerms)
                ) {
                    await MessageUtils.sendIntr(
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

                // Check if the member has all the required user permissions for this command
                // TODO: Remove "as GuildMember",  why does discord.js have intr.member as a "APIInteractionGuildMember"?
                if (intr.member && !this.hasPermission(intr.member as GuildMember, command)) {
                    await MessageUtils.sendIntr(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.missingUserPerms',
                            data.lang()
                        )
                    );
                    return false;
                }

                // Check if command requires premium
                if (
                    Config.payments.enabled &&
                    command.requirePremium &&
                    !data.subscription?.service
                ) {
                    await MessageUtils.sendIntr(
                        intr,
                        Lang.getEmbed('validation', 'embeds.premiumRequired', data.lang())
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

                        await MessageUtils.sendIntr(
                            intr,
                            Lang.getEmbed('validation', 'embeds.voteRequired', data.lang(), {
                                LAST_VOTE: voteTimeAgo,
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

    private static hasPermission(member: GuildMember, command: Command): boolean {
        // Debug option to bypass permission checks
        if (Debug.skip.checkPerms) {
            return true;
        }

        // Developers, server owners, and members with "Manage Server" have permission for all commands
        if (
            member.guild.ownerId === member.id ||
            member.permissions.has(Permissions.FLAGS.MANAGE_GUILD) ||
            Config.developers.includes(member.id)
        ) {
            return true;
        }

        // Check if member has required permissions for command
        if (!member.permissions.has(command.requireUserPerms)) {
            return false;
        }

        return true;
    }
}
