import { Client, Guild, Message, MessageReaction, User } from 'discord.js';
import schedule from 'node-schedule';

import { GuildJoinHandler, GuildLeaveHandler, MessageHandler, ReactionAddHandler } from './events';
import { BirthdayJob } from './jobs';
import { Logger } from './services';

let Logs = require('../lang/logs.json');
let Config = require('../config/config.json');
let Debug = require('../config/debug.json');

export class Bot {
    private ready = false;

    constructor(
        private token: string,
        private client: Client,
        private guildJoinHandler: GuildJoinHandler,
        private guildLeaveHandler: GuildLeaveHandler,
        private reactionAddHandler: ReactionAddHandler,
        private messageHandler: MessageHandler,
        private birthdayJob: BirthdayJob
    ) {}

    public async start(): Promise<void> {
        this.registerListeners();
        await this.login(this.token);
    }

    private registerListeners(): void {
        this.client.on('ready', () => this.onReady());
        this.client.on('shardReady', (shardId: number) => this.onShardReady(shardId));
        this.client.on('guildCreate', (guild: Guild) => this.onGuildJoin(guild));
        this.client.on('guildDelete', (guild: Guild) => this.onGuildLeave(guild));
        this.client.on('message', (msg: Message) => this.onMessage(msg));
        this.client.on('messageReactionAdd', (msgReaction: MessageReaction, reactor: User) =>
            this.onReactionAdd(msgReaction, reactor)
        );
    }

    private startJobs(): void {
        let postSchedule =
            Debug.enabled && Debug.overridePostScheduleEnabled
                ? Debug.overridePostSchedule
                : Config.postSchedule;
        schedule.scheduleJob(postSchedule, async () => {
            try {
                await this.birthdayJob.run();
            } catch (error) {
                Logger.error(Logs.error.birthdayJob, error);
                return;
            }
        });
    }

    private async login(token: string): Promise<void> {
        try {
            await this.client.login(token);
        } catch (error) {
            Logger.error(Logs.error.login, error);
            return;
        }
    }

    private onReady(): void {
        let userTag = this.client.user.tag;
        Logger.info(Logs.info.login.replace('{USER_TAG}', userTag));

        this.startJobs();
        Logger.info(Logs.info.startedJobs);

        this.ready = true;
    }

    private onShardReady(shardId: number): void {
        Logger.setShardId(shardId);
    }

    private async onGuildJoin(guild: Guild): Promise<void> {
        if (!this.ready) {
            return;
        }

        try {
            await this.guildJoinHandler.process(guild);
        } catch (error) {
            Logger.error(Logs.error.guildJoin, error);
        }
    }

    private async onGuildLeave(guild: Guild): Promise<void> {
        if (!this.ready) {
            return;
        }

        try {
            await this.guildLeaveHandler.process(guild);
        } catch (error) {
            Logger.error(Logs.error.guildLeave, error);
        }
    }

    private async onReactionAdd(msgReaction: any, reactor: User): Promise<void> {
        if (!this.ready) return;
        this.reactionAddHandler.process(msgReaction, reactor);
    }

    private async onMessage(msg: Message): Promise<void> {
        if (!this.ready) {
            return;
        }

        try {
            await this.messageHandler.process(msg);
        } catch (error) {
            Logger.error(Logs.error.message, error);
        }
    }
}
