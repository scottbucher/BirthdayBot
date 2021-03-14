import { MathUtils } from '../utils';
import { BirthdayService, Logger } from '../services';
import { BlacklistRepo, GuildRepo, UserRepo } from '../services/database/repos';
import { Client } from 'discord.js';

import { Job } from './job';
import { UserData } from '../models/database';
import moment from 'moment';
import schedule from 'node-schedule';

let Logs = require('../../lang/logs.json');

export class CelebrationJob implements Job {
    constructor(
        public schedule: string,
        public interval: number,
        private client: Client,
        private guildRepo: GuildRepo,
        private userRepo: UserRepo,
        private blacklistRepo: BlacklistRepo,
        private birthdayService: BirthdayService
    ) {}

    public async run(): Promise<void> {
        let now = moment();
        let today = moment().format('MM-DD');
        let tomorrow = moment().add(1, 'day').format('MM-DD');
        let yesterday = moment().subtract(1, 'day').format('MM-DD');

        // Get a user data list of all POSSIBLE birthday events, this includes birthday role, message AND role take.
        // Do to timezones and custom message time this can range by a day, thus we get 3 days worth of birthdays for each check
        let userDatas: UserData[] = [
            ...(await this.userRepo.getUsersWithBirthday(today)),
            ...(await this.userRepo.getUsersWithBirthday(tomorrow)),
            ...(await this.userRepo.getUsersWithBirthday(yesterday)),
        ];

        if (
            !MathUtils.isLeap(now.year()) &&
            (today === '02-28' || tomorrow === '02-28' || yesterday === '02-28')
        ) {
            // Add leap year birthdays to list
            userDatas.push(...(await this.userRepo.getUsersWithBirthday('02-29')));
        }
    }

    public start(): void {
        schedule.scheduleJob(this.schedule, async () => {
            try {
                Logger.info(Logs.info.birthdayJobStarted);
                await this.run();
                Logger.info(Logs.info.completedBirthdayJob);
            } catch (error) {
                Logger.error(Logs.error.birthdayJob, error);
            }
        });
    }
}
