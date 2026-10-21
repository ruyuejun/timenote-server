import { ServiceResponse } from 'src/interfaces/service.type'
import { User } from '../entities/user.entity'
import type { UserWithRoles } from '../user.service'

export type UserVo = ServiceResponse<User>

export type UserWithRolesVo = ServiceResponse<UserWithRoles>
