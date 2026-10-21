import { OrgSchema } from 'src/db/schema/org'

export class Org implements OrgSchema {
    id: number
    name: string
    shortName: string
    code: string
    logo: string
    tel: string
    email: string
    address: string
    status: number
    addTime: Date
    updTime: Date
    addUser: number
    delUser: number
    isDel: number
}
