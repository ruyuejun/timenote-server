import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import type { StringValue } from 'ms'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { R } from 'src/config/code.config'
import { RegisterWithUsernameDto } from './dto/register.dto'
import { UserService } from '../user/user.service'
import { CreateUserDto } from '../user/dto/create-user.dto'
import { LoginWithUsernameDto } from './dto/login.dto'
import { ServiceResponse } from 'src/interfaces/service.type'
import { User } from '../user/entities/user.entity'
import { FindUserDto } from '../user/dto/find-user.dto'

const scrypt = promisify(scryptCallback)

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService
    ) {}

    async registerWithUsername(dto: RegisterWithUsernameDto): ServiceResponse<User> {
        const findUserDto = new FindUserDto()
        findUserDto.username = dto.username
        const userRes = await this.userService.find(findUserDto)
        if (userRes.data.length > 0) {
            return R.errorAuthExist()
        }

        const password = await this.hashPassword(dto.password)

        const createUserDto = new CreateUserDto()
        createUserDto.username = dto.username
        createUserDto.password = password
        const createRes = await this.userService.create(createUserDto)

        if (createRes.code !== 200 || createRes.data.length === 0) {
            return createRes
        }

        const user = createRes.data[0]

        const token = await this.createToken(user.id, user.username || '')
        return R.successAuth(user, token, '')
    }

    async loginWithUsername(dto: LoginWithUsernameDto): ServiceResponse<User> {
        const findUserDto = new FindUserDto()
        findUserDto.username = dto.username
        const userRes = await this.userService.find(findUserDto)
        if (userRes.data.length <= 0) {
            return R.errorAuthNotFound()
        }

        console.log(userRes)

        const rawUser = userRes.data[0]
        if (!(await this.verifyPassword(dto.password, rawUser.password))) {
            return R.errorAuth('用户名或密码错误')
        }

        // 获取安全版本的用户数据
        const safeUserRes = await this.userService.findOne(rawUser.id)
        const safeUser = safeUserRes.data[0]

        const token = await this.createToken(rawUser.id, rawUser.username || '')
        return R.successAuth(safeUser, token, '')
    }

    private async createToken(id: number, username: string) {
        const token = await this.jwtService.signAsync(
            { sub: id, username: username || '' },
            { expiresIn: this.config.getOrThrow<StringValue>('JWT_EXPIRES_IN') }
        )
        return token
    }

    private async hashPassword(password: string) {
        const salt = randomBytes(16).toString('hex')
        const derivedKey = (await scrypt(password, salt, 64)) as Buffer
        return `scrypt:${salt}:${derivedKey.toString('hex')}`
    }

    private async verifyPassword(password: string, storedHash: string) {
        const [algorithm, salt, hash] = storedHash.split(':')
        if (algorithm !== 'scrypt' || !salt || !hash) {
            return false
        }

        const storedKey = Buffer.from(hash, 'hex')
        const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer
        return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey)
    }
}
