import { DataAccess } from '../data-access';
import { MemberAnniversaryRoles } from '../../../models/database/member-anniversary-role-models';
import { Procedure } from '../procedure';
import { SQLUtils } from '../../../utils';

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

    public async removeMemberAnniversaryRole(discordId: string, position: number): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.MemberAnniversaryRole_Remove, [
            discordId,
            position,
        ]);
    }

    public async clearMemberAnniversaryRoles(discordId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.MemberAnniversaryRole_Clear, [discordId]);
    }

    public async getMemberAnniversaryRoles(discordId: string): Promise<MemberAnniversaryRoles> {
        let results = await this.dataAccess.executeProcedure(Procedure.MemberAnniversaryRole_Get, [
            discordId,
        ]);

        let memberAnniversaryRoles = SQLUtils.getTable(results, 0);
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

        let memberAnniversaryRolesData = SQLUtils.getTable(results, 0);
        let stats = SQLUtils.getRow(results, 1, 0);
        return new MemberAnniversaryRoles(memberAnniversaryRolesData, stats);
    }
}
