import { BirthdayService, Logger } from '../services';
import { Client, Guild } from 'discord.js';

import { GuildRepo } from '../services/database/repos';
import { Job } from './job';

let Logs = require('../../lang/logs.json');

export class BirthdayJob implements Job {
    constructor(
        private client: Client,
        private guildRepo: GuildRepo,
        private birthdayService: BirthdayService
    ) {}

    public async run(): Promise<void> {
        Logger.info(Logs.info.birthdayJobStarted);

        // Get list of guilds the client is connected to
        let discordIds = this.client.guilds.cache.map(guild => guild.id);

        // Get guild data from the database
        let guildDatas = await this.guildRepo.getGuilds(discordIds);
        Logger.info(
            Logs.info.birthdayJobGuildCount.replace(
                '{GUILD_COUNT}',
                guildDatas.length.toLocaleString()
            )
        );

        let promises = [];

        for (let guildData of guildDatas) {
            // Resolve Guild
            let guild: Guild;
            try {
                guild = this.client.guilds.resolve(guildData.GuildDiscordId);
            } catch (error) {
                Logger.error(
                    Logs.error.resolveGuild.replace('{GUILD_ID}', guildData.GuildDiscordId),
                    error
                );
                continue;
            }

            promises.push(
                this.birthdayService.celebrateBirthdays(guild, guildData).catch(error => {
                    Logger.error(
                        Logs.error.celebrateBirthday
                            .replace('{GUILD_NAME}', guild.name)
                            .replace('{GUILD_ID}', guild.id),
                        error
                    );
                })
            );
        }

        // Wait for all birthday celebrations to finish
        await Promise.allSettled(promises);
        Logger.info(Logs.info.completedBirthdayJob);
    }
}
