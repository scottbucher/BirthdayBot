import { Client, Collection, GuildMember, ShardingManager } from 'discord.js';
import { HttpService, Logger } from '../services';

import { BotSite } from '../models/config-models';
import { Job } from './job';
import { ShardUtils } from '../utils';
import schedule from 'node-schedule';

let Config = require('../../config/config.json');
let BotSites: BotSite[] = require('../../config/bot-sites.json');
let Logs = require('../../lang/logs.json');

export class UpdateMemberCacheJob implements Job {
    public name = 'Update Server Count';
    public schedule: string = Config.jobs.updateMemberCache.schedule;
    public log: boolean = Config.jobs.updateMemberCache.log;

    constructor(private client: Client) {}

    public async run(): Promise<void> {
        // Update cache

        // Collection of guilds
        let guildCache = this.client.guilds.cache;

        for (let guild of guildCache.array()) {
            let guildMembers: Collection<string, GuildMember> = guild.members.cache;
            let beforeCacheSize = guild.members.cache.size;

            try {
                guildMembers = await guild.members.fetch();
            } catch (error) {
                // Ignore, not much we can do
            }
        }
    }

    public start(): void {
        schedule.scheduleJob(this.schedule, async () => {
            try {
                await this.run();
            } catch (error) {
                Logger.error(Logs.error.updateServerCount, error);
            }
        });
    }
}
