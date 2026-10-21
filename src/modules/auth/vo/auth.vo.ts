import { ServiceResponse } from 'src/interfaces/service.type'
import { User } from 'src/modules/user/entities/user.entity'

export type RegisterVo = ServiceResponse<User>

export type LoginVo = ServiceResponse<User>
