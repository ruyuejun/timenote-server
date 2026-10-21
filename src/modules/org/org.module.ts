import { Module } from '@nestjs/common'
import { OrgService } from './org.service'
import { OrgStructureService } from './org-structure.service'
import { OrgMemberService } from './org-member.service'
import { OrgController } from './org.controller'
import { OrgDao } from './dao/org.dao'
import { OrgStructureDao } from './dao/org-structure.dao'
import { OrgMemberDao } from './dao/org-member.dao'

@Module({
    controllers: [OrgController],
    providers: [OrgService, OrgStructureService, OrgMemberService, OrgDao, OrgStructureDao, OrgMemberDao],
    exports: [OrgService, OrgStructureService, OrgMemberService],
})
export class OrgModule {}
