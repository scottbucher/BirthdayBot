import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';
import { SQLUtils } from '../../../utils';
import { UserData } from '../../../models/database/user-models';
import { UserDataResults } from '../../../models/database/user-data-results-models';

export class UserRepo {
    constructor(private dataAccess: DataAccess) {}

    public async getUser(discordId: string): Promise<UserData> {
        let results = await this.dataAccess.executeProcedure(Procedure.User_Get, [discordId]);
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

    public async getBirthdayListFull(
        guildId: string,
        discordIds: string[],
        pageSize: number,
        page: number
    ): Promise<UserDataResults> {
        let results = await this.dataAccess.executeProcedure(Procedure.User_GetFullList, [
            guildId,
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
            birthday
        ]);

        return SQLUtils.getFirstResult(results);
    }

    public async addUserVote(
        botSiteName: string,
        discordId: string
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.User_AddVote, [
            botSiteName,
            discordId
        ]);
    }
}
