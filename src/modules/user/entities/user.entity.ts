import { Exclude } from 'src/common/decorators/exclude.decorator'
import { UserSchema } from 'src/db/schema/user'

export class User implements UserSchema {
    id: number
    username: string
    tel: string
    email: string
    nickname: string
    avatar: string
    gender: number
    birth: string
    addTime: Date
    updTime: Date
    addUser: number
    delUser: number
    isDel: number

    @Exclude()
    openid: string

    @Exclude()
    password: string
}
