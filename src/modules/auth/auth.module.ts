import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import type { StringValue } from 'ms'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { UserModule } from '../user/user.module'

@Module({
    imports: [
        JwtModule.registerAsync({
            global: true,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow<string>('JWT_SECRET'),
                signOptions: { expiresIn: config.getOrThrow<StringValue>('JWT_EXPIRES_IN') },
            }),
        }),
        UserModule,
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule {}
