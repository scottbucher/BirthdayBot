import { MemberAnniversaryRoles } from '../../../models/database/member-anniversary-role-models';
import { SqlUtils } from '../../../utils';
import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';

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
        const results = await this.dataAccess.executeProcedure(Procedure.MemberAnniversaryRole_Get, [
            discordId,
        ]);

        const memberAnniversaryRoles = SqlUtils.getTable(results, 0);
        return new MemberAnniversaryRoles(memberAnniversaryRoles, null);
    }

    public async getMemberAnniversaryRoleList(
        guildId: string,
        pageSize: number,
        page: number
    ): Promise<MemberAnniversaryRoles> {
        const results = await this.dataAccess.executeProcedure(
            Procedure.MemberAnniversaryRole_GetList,
            [guildId, pageSize, page]
        );

        const memberAnniversaryRolesData = SqlUtils.getTable(results, 0);
        const stats = SqlUtils.getRow(results, 1, 0);
        return new MemberAnniversaryRoles(memberAnniversaryRolesData, stats);
    }
}
