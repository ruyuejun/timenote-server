import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UserService } from 'src/modules/user/user.service'
import { JwtPayload } from 'src/interfaces/jwt.type'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private usersService: UserService,
        config: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
        })
    }

    // validate 方法会在用户通过 JWT 验证后自动调用
    async validate(payload: JwtPayload) {
        // payload 是 JWT 解码后的内容，通常包含 userId
        // 根据 userId 从数据库查询完整的用户信息
        const uid = payload.sub
        if (!uid) {
            return null
        }
        const users = await this.usersService.findOne(payload.sub)
        if (users.data.length <= 0) {
            return null // 或抛出异常
        }
        const user = users.data[0]
        // 返回的对象自动挂载到 request.user
        return {
            userId: user.id,
            username: user.username,
            roles: user.roles,
        }
    }
}
