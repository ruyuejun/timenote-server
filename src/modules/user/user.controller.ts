import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { ZodPipe } from 'src/libs/zod2'
import { FindUserDto } from './dto/find-user.dto'
import type { UserVo, UserWithRolesVo } from './vo/user.vo'
import { JwtAuth } from 'src/common/decorators/jwt.decorator'

@JwtAuth()
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    create(@Body(new ZodPipe()) dto: CreateUserDto): UserVo {
        return this.userService.create(dto)
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.userService.remove(+id)
    }

    @Put(':id')
    update(@Param('id') id: string, @Body(new ZodPipe()) dto: UpdateUserDto) {
        return this.userService.update(+id, dto)
    }

    @Patch(':id')
    change(@Param('id') id: string, @Body(new ZodPipe()) dto: UpdateUserDto) {
        return this.userService.update(+id, dto)
    }

    @Get()
    async find(@Query(new ZodPipe()) dto: FindUserDto): UserVo {
        return await this.userService.find(dto)
    }

    @Get('page')
    async findPage(@Query(new ZodPipe()) dto: FindUserDto): UserVo {
        return await this.userService.findPage(dto)
    }

    @Get(':id')
    findOne(@Param('id') id: string): UserWithRolesVo {
        return this.userService.findOne(+id)
    }
}
