import { DocSchema } from 'src/db/schema/doc'

export class Doc implements DocSchema {
    id: number
    name: string
    content: unknown
    pid: number
    uid: number
    gid: number
    type: number
    vcode: number
    vname: string
    addTime: Date
    updTime: Date
    addUser: number
    delUser: number
    isDel: number
}
