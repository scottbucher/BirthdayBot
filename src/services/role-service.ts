import { ActionUtils, CelebrationUtils, TimeUtils } from '../utils';
import { Client, Guild, GuildMember, Role } from 'discord.js';
import { GuildCelebrationData, MemberAnniversaryRole } from '../models/database';

let Config = require('../../config/config.json');
export class RoleService {
    // TODO: add to config
    public interval: number = 0.5;

    public async run(
        client: Client,
        guildCelebrationDatas: GuildCelebrationData[],
        addBirthdayRoleGuildMembers: GuildMember[],
        removeBirthdayRoleGuildMembers: GuildMember[],
        anniversaryRoleGuildMembers: GuildMember[],
        guildsWithPremium: string[]
    ): Promise<void> {
        // Only get the guilds which actually might need a role given
        let filteredGuilds = guildCelebrationDatas.filter(
            data =>
                addBirthdayRoleGuildMembers
                    .map(member => member.guild.id)
                    .includes(data.guildData.GuildDiscordId) ||
                removeBirthdayRoleGuildMembers
                    .map(member => member.guild.id)
                    .includes(data.guildData.GuildDiscordId) ||
                anniversaryRoleGuildMembers
                    .map(member => member.guild.id)
                    .includes(data.guildData.GuildDiscordId)
        );

        // Lets loop through the guilds
        for (let filteredGuild of filteredGuilds) {
            let guild: Guild;
            try {
                guild = await client.guilds.fetch(filteredGuild.guildData.GuildDiscordId);
            } catch (error) {
                continue;
            }

            // We need to filter the GuildMember lists given by the parameters to only those in this guild
            let addBirthdayGuildMembers = addBirthdayRoleGuildMembers.filter(
                member => member.guild.id === guild.id
            );
            let removeBirthdayGuildMembers = removeBirthdayRoleGuildMembers.filter(
                member => member.guild.id === guild.id
            );
            let addAnniversaryGuildMembers = anniversaryRoleGuildMembers.filter(
                member => member.guild.id === guild.id
            );

            let hasPremium = guildsWithPremium.includes(guild.id);
            let birthdayRole: Role;
            let trustedRoles: Role[];
            let anniversaryRoles: Role[];

            try {
                birthdayRole = await guild.roles.fetch(
                    filteredGuild.guildData.BirthdayRoleDiscordId
                );
            } catch (error) {
                // No birthday role
            }

            let anniversaryRoleData: MemberAnniversaryRole[];

            // Only premium guilds get anniversary roles
            if (hasPremium) {
                // Get our list of anniversary roles
                anniversaryRoles = await CelebrationUtils.getMemberAnniversaryRoleList(
                    guild,
                    filteredGuild.anniversaryRoles
                );

                // Get the data of the roles we could resolve (we need the data so we can check years later!)
                anniversaryRoleData = filteredGuild.anniversaryRoles.filter(data =>
                    anniversaryRoles.map(r => r.id).includes(data.MemberAnniversaryRoleDiscordId)
                );
            }

            // The birthday role must exist in order to add/remove it and we need at least one member who need the role
            if (birthdayRole && addBirthdayGuildMembers.length > 0) {
                // Get our list of trusted roles
                trustedRoles = await CelebrationUtils.getTrustedRoleList(
                    guild,
                    filteredGuild.trustedRoles
                );

                for (let addBirthdayMember of addBirthdayGuildMembers) {
                    if (
                        CelebrationUtils.passesTrustedCheck(
                            filteredGuild.guildData.RequireAllTrustedRoles,
                            trustedRoles,
                            addBirthdayMember,
                            filteredGuild.guildData.TrustedPreventsRole,
                            hasPremium
                        )
                    )
                        await ActionUtils.giveRole(addBirthdayMember, birthdayRole);
                }

                // Take birthday role regardless of trusted role?
                for (let removeBirthdayMember of removeBirthdayGuildMembers) {
                    await ActionUtils.removeRole(removeBirthdayMember, birthdayRole);
                }
            }

            // There has to be anniversary roles in order to give them (extra premium check is prob redundant)
            if (
                addAnniversaryGuildMembers.length > 0 &&
                anniversaryRoles.length > 0 &&
                hasPremium
            ) {
                for (let addAnniversaryRoleMember of addAnniversaryGuildMembers) {
                    let memberYears = CelebrationUtils.getMemberYears(
                        addAnniversaryRoleMember,
                        filteredGuild.guildData
                    );
                    for (let role of anniversaryRoles) {
                        let roleData = anniversaryRoleData.find(
                            data => data.MemberAnniversaryRoleDiscordId === role.id
                        );

                        if (roleData.Year === memberYears) {
                            await ActionUtils.giveRole(addAnniversaryRoleMember, role);
                        }
                    }
                }
            }

            // Wait between guilds
            await TimeUtils.sleep(this.interval);
        }
    }
}
