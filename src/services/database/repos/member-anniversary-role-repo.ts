import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';
import { SQLUtils } from '../../../utils';
import { TrustedRoles } from '../../../models/database/trusted-role-models';

export class MemberAnniversaryRoleRepo {
    constructor(private dataAccess: DataAccess) {}

    public async addMemberAnniversaryRole(discordId: string, roleId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.MemberAnniversaryRole_Add, [
            discordId,
            roleId,
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

    public async getMemberAnniversaryRoles(discordId: string): Promise<TrustedRoles> {
        let results = await this.dataAccess.executeProcedure(Procedure.MemberAnniversaryRole_Get, [
            discordId,
        ]);

        let memberAnniversaryRoles = SQLUtils.getTable(results, 0);
        return new TrustedRoles(memberAnniversaryRoles, null);
    }

    public async getMemberAnniversaryRoleList(
        guildId: string,
        pageSize: number,
        page: number
    ): Promise<TrustedRoles> {
        let results = await this.dataAccess.executeProcedure(
            Procedure.MemberAnniversaryRole_GetList,
            [guildId, pageSize, page]
        );

        let memberAnniversaryRolesData = SQLUtils.getTable(results, 0);
        let stats = SQLUtils.getRow(results, 1, 0);
        return new TrustedRoles(memberAnniversaryRolesData, stats);
    }
}
