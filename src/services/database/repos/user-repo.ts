import { UserData, UserDataResults, Vote } from '../../../models/database';

import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';
import { SQLUtils } from '../../../utils';

export class UserRepo {
    constructor(private dataAccess: DataAccess) {}

    public async getUser(discordId: string): Promise<UserData> {
        let results = await this.dataAccess.executeProcedure(Procedure.User_Get, [discordId]);
        return SQLUtils.getFirstResultFirstRow(results);
    }

    public async getUserVote(discordId: string): Promise<Vote> {
        let results = await this.dataAccess.executeProcedure(Procedure.User_GetLastVote, [
            discordId,
        ]);
        return SQLUtils.getFirstResultFirstRow(results);
    }

    public async getAllUsers(discordIds: string[]): Promise<UserData[]> {
        let results = await this.dataAccess.executeProcedure(Procedure.User_GetAll, [
            discordIds.join(','),
        ]);
        return SQLUtils.getFirstResult(results);
    }

    public async addOrUpdateUser(
        discordId: string,
        birthday: string,
        timeZone: string,
        changesLeft: number
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.User_AddOrUpdate, [
            discordId,
            birthday,
            timeZone,
            changesLeft,
        ]);
    }

    public async getBirthdayListFullFromDate(
        discordIds: string[],
        pageSize: number,
        date: number
    ): Promise<UserDataResults> {
        let results = await this.dataAccess.executeProcedure(Procedure.User_GetFullListFromDate, [
            discordIds.join(','),
            pageSize,
            date,
        ]);

        let userData = SQLUtils.getFirstResult(results);
        let stats = SQLUtils.getSecondResultFirstRow(results);
        return new UserDataResults(userData, stats);
    }

    public async getBirthdayListFull(
        discordIds: string[],
        pageSize: number,
        page: number
    ): Promise<UserDataResults> {
        let results = await this.dataAccess.executeProcedure(Procedure.User_GetFullList, [
            discordIds.join(','),
            pageSize,
            page,
        ]);

        let userData = SQLUtils.getFirstResult(results);
        let stats = SQLUtils.getSecondResultFirstRow(results);
        return new UserDataResults(userData, stats);
    }

    public async getUsersWithBirthday(birthday: string): Promise<UserData[]> {
        let results = await this.dataAccess.executeProcedure(Procedure.User_GetBirthdays, [
            birthday,
        ]);

        return SQLUtils.getFirstResult(results);
    }

    public async addUserVote(botSiteName: string, discordId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.User_AddVote, [botSiteName, discordId]);
    }

    public async getUserCount(): Promise<number> {
        let results = await this.dataAccess.executeProcedure(Procedure.User_GetTotalCount, []);
        return SQLUtils.getFirstResult(results)[0].Total;
    }

    public async getUserBirthdaysTodayCount(birthday: string): Promise<number> {
        let results = await this.dataAccess.executeProcedure(
            Procedure.User_GetBirthdaysTodayCount,
            [birthday]
        );
        return SQLUtils.getFirstResult(results)[0].Total;
    }

    public async getUserBirthdaysThisMonthCount(birthday: string): Promise<number> {
        let results = await this.dataAccess.executeProcedure(
            Procedure.User_GetBirthdaysThisMonthCount,
            [birthday]
        );
        return SQLUtils.getFirstResult(results)[0].Total;
    }
}
