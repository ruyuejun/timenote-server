import { OrgStructureSchema, OrgStructureTreeSchema } from 'src/db/schema/org-structure'

export class OrgStructure implements OrgStructureSchema {
    id: number
    oid: number
    pid: number
    name: string
    code: string
    leader: string
    addTime: Date
    updTime: Date
    addUser: number
    delUser: number
    isDel: number
}

export class OrgStructureTree implements OrgStructureTreeSchema {
    id: number
    oid: number
    pid: number
    name: string
    code: string
    leader: string
    addTime: Date
    updTime: Date
    addUser: number
    delUser: number
    isDel: number
    children: OrgStructureTreeSchema[] = []
}
