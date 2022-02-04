import { Client } from 'discord.js';
import schedule from 'node-schedule';

import { Logger } from '../services/index.js';
import { TimeUtils } from '../utils/index.js';
import { Job } from './index.js';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class UpdateMemberCacheJob implements Job {
    public name = 'Update Member Cache';
    public schedule: string = Config.jobs.updateMemberCacheJob.schedule;
    public log: boolean = Config.jobs.updateMemberCacheJob.log;
    public interval: number = Config.jobs.updateMemberCacheJob.interval;

    constructor(private client: Client) {}

    public async run(): Promise<void> {
        // Collection of guilds
        let guildCache = this.client.guilds.cache;

        for (let guild of guildCache.values()) {
            try {
                await guild.members.fetch();
            } catch (error) {
                // Ignore, not much we can do
            } finally {
                // Regardless we wait since we made an api call
                await TimeUtils.sleep(this.interval);
            }
        }
    }

    public start(): void {
        schedule.scheduleJob(this.schedule, async () => {
            try {
                await this.run();
            } catch (error) {
                Logger.error(Logs.error.updateMemberCache, error);
            }
        });
    }
}
