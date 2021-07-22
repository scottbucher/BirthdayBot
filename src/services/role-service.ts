import { ActionUtils, CelebrationUtils, TimeUtils } from '../utils';
import { Client, Role } from 'discord.js';

import { BirthdayRoleGuildMembers } from '../models';
import { GuildCelebrationData } from '../models/database';
import { Logger } from '.';
import { MemberAnniversaryRoleGuildMembers } from '../models/celebration-job';
import { performance } from 'perf_hooks';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class RoleService {
    // TODO: add to config

    public async run(
        client: Client,
        guildCelebrationDatas: GuildCelebrationData[],
        birthdayRoleGuildMembers: BirthdayRoleGuildMembers[],
        memberAnniversaryRoleGuildMembers: MemberAnniversaryRoleGuildMembers[],
        guildsWithPremium: string[]
    ): Promise<void> {
        let birthdayRolePerformanceStart = performance.now();
        if (birthdayRoleGuildMembers.length > 0) {
            // Do our trusted checks and then do roles

            // Each birthday role data should be one guild (one birthday role per guild)
            for (let birthdayRoleData of birthdayRoleGuildMembers) {
                let guild = birthdayRoleData.role.guild;
                try {
                    let hasPremium = guildsWithPremium.includes(guild.id);

                    let guildCelebrationData = guildCelebrationDatas.find(
                        g => g.guildData.GuildDiscordId === guild.id
                    );

                    let trustedRoles: Role[];

                    // If trusted prevents the role and there are trusted roles in the database lets try to resolve them
                    if (
                        guildCelebrationData.guildData.TrustedPreventsRole &&
                        guildCelebrationData.trustedRoles.length > 0
                    ) {
                        trustedRoles = await CelebrationUtils.getTrustedRoleList(
                            guild,
                            guildCelebrationData.trustedRoles
                        );
                    }

                    // Give Role
                    for (let birthdayMemberStatus of birthdayRoleData.memberRoleStatuses) {
                        // If any trusted roles resolved and they don't pass the trusted check lets skip them
                        if (
                            trustedRoles?.length > 0 &&
                            !CelebrationUtils.passesTrustedCheck(
                                guildCelebrationData.guildData.RequireAllTrustedRoles,
                                trustedRoles,
                                birthdayMemberStatus.member,
                                guildCelebrationData.guildData.TrustedPreventsRole,
                                hasPremium
                            )
                        ) {
                            continue;
                        }

                        // Otherwise lets give/take the role
                        if (birthdayMemberStatus.give) {
                            // Give the role
                            await ActionUtils.giveRole(
                                birthdayMemberStatus.member,
                                birthdayRoleData.role,
                                Config.delays.roles
                            );
                        } else {
                            // Remove the role
                            await ActionUtils.removeRole(
                                birthdayMemberStatus.member,
                                birthdayRoleData.role,
                                Config.delays.roles
                            );
                        }
                    }
                } catch (error) {
                    // Error for a guild when giving birthday roles
                    Logger.error(
                        Logs.error.birthdayRoleServiceFailed
                            .replace('{GUILD_ID}', guild.id)
                            .replace('{GUILD_NAME}', guild.name),
                        error
                    );
                }
                // Sleep in between guilds
                await TimeUtils.sleep(300);
            }
        }
        Logger.info(
            `Finished birthday role service in ${
                (performance.now() - birthdayRolePerformanceStart) / 1000
            }s`
        );

        let memberAnniversaryRolePerformanceStart = performance.now();
        // Do we need a premium check here? Server without premium shouldn't have roles passed in so maybe no?
        if (memberAnniversaryRoleGuildMembers.length > 0) {
            for (let memberAnniversaryRoleData of memberAnniversaryRoleGuildMembers) {
                try {
                    // Give Role
                    for (let giveMemberRole of memberAnniversaryRoleData.members) {
                        await ActionUtils.giveRole(
                            giveMemberRole,
                            memberAnniversaryRoleData.memberAnniversaryRole,
                            Config.delays.roles
                        );
                    }
                } catch (error) {
                    // Error when giving out a member anniversary role to members
                    Logger.error(
                        Logs.error.anniversaryRoleServiceFailed
                            .replace(
                                '{GUILD_ID}',
                                memberAnniversaryRoleData.memberAnniversaryRole.guild.id
                            )
                            .replace(
                                '{GUILD_NAME}',
                                memberAnniversaryRoleData.memberAnniversaryRole.guild.name
                            ),
                        error
                    );
                }
                // Sleep in between guilds
                await TimeUtils.sleep(300);
            }
        }
        Logger.info(
            `Finished member anniversary role service in ${
                (performance.now() - memberAnniversaryRolePerformanceStart) / 1000
            }s`
        );
    }
}
