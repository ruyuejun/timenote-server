import { SetMetadata } from '@nestjs/common'

// 元数据key，供守卫读取
export const ROLES_KEY = 'roles'

// 角色名装饰器
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)
