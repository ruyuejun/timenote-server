import { ServiceResponse } from 'src/interfaces/service.type'
import { Org } from '../entities/org.entity'
import { OrgStructure, OrgStructureTree } from '../entities/org-structure.entity'
import { OrgMember } from '../entities/org-member.entity'

// Org
export type OrgVo = ServiceResponse<Org>

// Structure
export type OrgStructureVo = ServiceResponse<OrgStructure>
export type OrgStructureTreeVo = ServiceResponse<OrgStructureTree>

// Member
export type OrgMemberVo = ServiceResponse<OrgMember>
