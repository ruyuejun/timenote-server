import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { FastifyRequest } from 'fastify'

export interface JwtPayload {
    sub: number
    username: string
}

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly config: ConfigService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<FastifyRequest & { user?: JwtPayload }>()
        const token = this.extractTokenFromHeader(request)

        if (!token) {
            throw new UnauthorizedException('请先登录')
        }

        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
                secret: this.config.getOrThrow<string>('JWT_SECRET'),
            })

            // 将用户信息附加到 request 对象上
            request.user = payload

            // 打印解码后的用户信息
            if (this.config.get<string>('NODE_ENV') === 'development') {
                const controllerName = context.getClass().name
                const handlerName = context.getHandler().name
                console.log(`👤 JWT :${controllerName}.${handlerName} - ${payload.sub} ${payload.username}`)
            }
        } catch (error) {
            console.error('JWT 验证失败:', error)
            throw new UnauthorizedException('无效的认证令牌')
        }

        return true
    }

    private extractTokenFromHeader(request: FastifyRequest & { user?: JwtPayload }): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? []
        return type === 'Bearer' ? token : undefined
    }
}
