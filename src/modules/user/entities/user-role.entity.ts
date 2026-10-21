import { UserRoleSchema } from 'src/db/schema/user-role'

export class UserRole implements UserRoleSchema {
    id: number
    rid: number
    uid: number
    isDel: number
    addTime: Date
    updTime: Date
    addUser: number
    delUser: number
}
