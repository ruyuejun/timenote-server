import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from 'src/common/decorators/role.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ])
        if (!requiredRoles) {
            return true
        }
        const { user } = context.switchToHttp().getRequest()
        // 此时 user.roles 已经包含了从数据库查询到的角色
        // return requiredRoles.some(role => user.roles?.includes(role))

        const userRoles = user.roles || []
        const hasRole = requiredRoles.some(role => {
            // 简单层级：如果用户有 admin，则满足 admin/editor/viewer 任何需求
            if (userRoles.includes('admin')) return true
            if (role === 'editor' && userRoles.includes('editor')) return true
            if (role === 'viewer' && userRoles.includes('viewer')) return true
            return false
        })
        return hasRole
    }
}
