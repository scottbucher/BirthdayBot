import { MemberAnniversaryRoles } from '../../../models/database/member-anniversary-role-models.js';
import { SqlUtils } from '../../../utils/index.js';
import { DataAccess, Procedure } from '../index.js';
export class MemberAnniversaryRoleRepo {
    constructor(private dataAccess: DataAccess) {}

    public async addMemberAnniversaryRole(
        discordId: string,
        roleId: string,
        year: number
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.MemberAnniversaryRole_Add, [
            discordId,
            roleId,
            year,
        ]);
    }

    public async removeMemberAnniversaryRole(discordId: string, year: number): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.MemberAnniversaryRole_Remove, [
            discordId,
            year,
        ]);
    }

    public async clearMemberAnniversaryRoles(discordId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.MemberAnniversaryRole_Clear, [discordId]);
    }

    public async getMemberAnniversaryRoles(discordId: string): Promise<MemberAnniversaryRoles> {
        let results = await this.dataAccess.executeProcedure(Procedure.MemberAnniversaryRole_Get, [
            discordId,
        ]);

        let memberAnniversaryRoles = SqlUtils.getTable(results, 0);
        return new MemberAnniversaryRoles(memberAnniversaryRoles, null);
    }

    public async getMemberAnniversaryRoleList(
        guildId: string,
        pageSize: number,
        page: number
    ): Promise<MemberAnniversaryRoles> {
        let results = await this.dataAccess.executeProcedure(
            Procedure.MemberAnniversaryRole_GetList,
            [guildId, pageSize, page]
        );

        let memberAnniversaryRolesData = SqlUtils.getTable(results, 0);
        let stats = SqlUtils.getRow(results, 1, 0);
        return new MemberAnniversaryRoles(memberAnniversaryRolesData, stats);
    }
}
