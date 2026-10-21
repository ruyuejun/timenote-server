import { OrgMemberSchema } from 'src/db/schema/org-member'

export class OrgMember implements OrgMemberSchema {
    id: number
    oid: number
    sid: number
    code: string
    name: string
    tel: string
    email: string
    avatar: string
    gender: number
    position: string
    status: number
    addTime: Date
    updTime: Date
    addUser: number
    delUser: number
    isDel: number
}
