import { DocHistorySchema } from 'src/db/schema/doc-history'

export class DocHistory implements DocHistorySchema {
    id: number
    did: number
    uid: number
    gid: number
    type: number
    name: string
    content: unknown
    vcode: number
    vname: string
    upuid: number
    isDel: number
    addTime: Date
    updTime: Date
    addUser: number
    delUser: number
}
