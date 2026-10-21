import { Injectable } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { R } from 'src/config/code.config'
import { UserDao } from './dao/user.dao'
import { FindUserDto } from './dto/find-user.dto'
import { User } from './entities/user.entity'
import { ServiceResponse } from 'src/interfaces/service.type'

export type UserWithRoles = User & { roles: number[] }

@Injectable()
export class UserService {
    constructor(private readonly userDao: UserDao) {}

    async create(dto: CreateUserDto): ServiceResponse<UserWithRoles> {
        const raw = await this.userDao.create(dto)
        const user = await this.userDao.findByIdWithRoles(raw[0].id)
        return R.success(user)
    }

    async remove(id: number): ServiceResponse<never> {
        await this.userDao.delete(id)
        return R.success()
    }

    async update(id: number, dto: UpdateUserDto): ServiceResponse<never> {
        await this.userDao.update(id, dto)
        return R.success()
    }

    async find(dto: FindUserDto): ServiceResponse<UserWithRoles> {
        const list = await this.userDao.findWithRoles(dto)
        return R.success(list)
    }

    async findPage(dto: FindUserDto): ServiceResponse<UserWithRoles> {
        const page = dto.page
        const limit = dto.limit
        const [list, total] = await Promise.all([
            this.userDao.findPageWithRoles(page, limit),
            this.userDao.countWithRoles(dto),
        ])
        return R.success(list, total)
    }

    async findOne(id: number): ServiceResponse<UserWithRoles> {
        const raw = await this.userDao.findByIdWithRoles(id)
        if (raw.length <= 0) {
            return R.errorAuthNotFound()
        }
        return R.success(raw)
    }
}
