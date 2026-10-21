import {
    IsString,
    IsInt,
    IsEmail,
    Min,
    Max,
    MinLength,
    MaxLength,
    IsOptional,
    IsNullable,
    Type2Number,
    compileZodSchema,
    IsDate,
} from 'src/libs/zod2/index'

export class CreateUserDto {
    @IsString('手机号必须是字符串')
    @MinLength(11, '手机号格式不正确')
    @MaxLength(11, '手机号格式不正确')
    tel!: string

    @IsString('用户名必须是字符串')
    @MinLength(1, '用户名长度不能少于1')
    @MaxLength(255, '用户名长度不能超过255')
    username!: string

    @IsString('密码必须是字符串')
    @MinLength(8, '密码长度不能少于8')
    @MaxLength(255, '密码长度不能超过255')
    password!: string

    @IsOptional()
    @IsEmail('邮箱格式不正确')
    @MaxLength(255, '邮箱长度不能超过255')
    email?: string

    @IsOptional()
    @IsString('昵称必须是字符串')
    @MaxLength(255, '昵称长度不能超过255')
    nickname?: string

    @IsOptional()
    @IsString('头像必须是字符串')
    @MaxLength(255, '头像长度不能超过255')
    avatar?: string

    @IsOptional()
    @Type2Number()
    @IsInt('性别必须是整数')
    @Min(0, '性别值不正确')
    @Max(2, '性别值不正确')
    gender?: number

    @IsOptional()
    @IsNullable()
    @IsDate('生日格式不正确')
    birth?: string
}

// 导出 Zod Schema 供前端使用
export const CreateUserSchema = compileZodSchema(CreateUserDto)
