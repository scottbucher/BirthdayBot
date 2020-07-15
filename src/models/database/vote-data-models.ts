export class VoteData {
    BotDiscordId: string;
    UserDiscordId: string;
    Type: string;
    IsWeekend: boolean;
    Query: string;

    constructor(
        body: any
        ) {
            this.BotDiscordId = body.bot;
            this.UserDiscordId = body.user;
            this.Type = body.type;
            this.IsWeekend = body.IsWeekend;
            this.Query = body.query;
        }
}
