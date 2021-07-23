import { Client } from 'discord.js';
import { Logger } from '../services';

import { Job } from './job';
import schedule from 'node-schedule';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class UpdateMemberCacheJob implements Job {
    public name = 'Update Member Cache';
    public schedule: string = Config.jobs.udateMemberCacheJob.schedule;
    public log: boolean = Config.jobs.udateMemberCacheJob.log;

    constructor(private client: Client) {}

    public async run(): Promise<void> {
        // Collection of guilds
        let guildCache = this.client.guilds.cache;

        for (let guild of guildCache.array()) {
            try {
                await guild.members.fetch();
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
                Logger.error(Logs.error.updateMemberCache, error);
            }
        });
    }
}
