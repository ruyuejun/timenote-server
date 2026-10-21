import { UseGuards, applyDecorators, ExecutionContext, createParamDecorator } from '@nestjs/common'
import { JwtGuard, JwtPayload } from '../guards/jwt.guard'

/**
 * JWT 认证装饰器
 *
 * 可以用在 Controller 类上或单个方法上
 *
 * @example
 * // 用在整个 Controller 类上
 * @JwtAuth()
 * @Controller('users')
 * export class UserController {
 *   // 所有方法都会进行 JWT 验证
 * }
 *
 * @example
 * // 用在单个方法上
 * @Controller('users')
 * export class UserController {
 *   @JwtAuth()
 *   @Get('profile')
 *   getProfile() {
 *     // 只有这个方法会进行 JWT 验证
 *   }
 * }
 */
export const JwtAuth = () => {
    return applyDecorators(UseGuards(JwtGuard))
}

/**
 * 获取当前登录用户信息的装饰器
 *
 * 需要配合 @JwtAuth() 装饰器使用
 *
 * @example
 * @JwtAuth()
 * @Get('profile')
 * getProfile(User() user: JwtPayload) {
 *   console.log(user.sub, user.username)
 *   return user
 * }
 *
 * @example
 * // 只获取用户 ID
 * @JwtAuth()
 * @Get('profile')
 * getProfile(@User('sub') userId: number) {
 *   return userId
 * }
 */
export const User = createParamDecorator((data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as JwtPayload

    return data ? user?.[data] : user
})
