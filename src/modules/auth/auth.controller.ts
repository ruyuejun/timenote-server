import { Body, Controller, Post } from '@nestjs/common'
import { ZodPipe } from 'src/libs/zod2'
import { AuthService } from './auth.service'
import { RegisterWithUsernameDto } from './dto/register.dto'
import { LoginWithUsernameDto } from './dto/login.dto'
import type { LoginVo, RegisterVo } from './vo/auth.vo'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('/register')
    register(@Body(new ZodPipe()) dto: RegisterWithUsernameDto): RegisterVo {
        return this.authService.registerWithUsername(dto)
    }

    @Post('/login')
    login(@Body(new ZodPipe()) dto: LoginWithUsernameDto): LoginVo {
        return this.authService.loginWithUsername(dto)
    }
}
