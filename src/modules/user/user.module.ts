import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { UserDao } from './dao/user.dao'

@Module({
    controllers: [UserController],
    providers: [UserService, UserDao],
    exports: [UserService],
})
export class UserModule {}
