import { IsString, MaxLength, MinLength, compileZodSchema } from 'src/libs/zod2'

export class LoginWithUsernameDto {
    @IsString('用户名必须是字符串')
    @MinLength(3, '用户名长度不能少于3')
    @MaxLength(255, '用户名长度不能超过255')
    username!: string

    @IsString('密码必须是字符串')
    @MinLength(8, '密码长度不能少于8')
    @MaxLength(128, '密码长度不能超过128')
    password!: string
}

export const LoginWithUsernameSchema = compileZodSchema(LoginWithUsernameDto)

export class LoginWithTelDto {
    @IsString('手机号必须是字符串')
    @MinLength(11, '手机号长度不能少于11')
    @MaxLength(11, '手机号长度不能超过11')
    tel!: string

    @IsString('验证码必须是字符串')
    @MinLength(6, '验证码长度不能少于6')
    @MaxLength(6, '验证码长度不能超过6')
    code!: string
}

export const LoginWithTelSchema = compileZodSchema(LoginWithTelDto)
