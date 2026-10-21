import { IsString, IsInt, Min, Max, IsOptional, Type2Number, compileZodSchema } from 'src/libs/zod2'

export class FindUserDto {
    @IsOptional()
    @IsString('用户名必须是字符串')
    username?: string

    @IsOptional()
    @IsString('名称必须是字符串')
    nickname?: string

    @IsOptional()
    @Type2Number()
    @IsInt('页码必须是整数')
    @Min(1, '页码不能小于1')
    page: number = 1

    @IsOptional()
    @Type2Number()
    @IsInt('每页数量必须是整数')
    @Min(1, '每页数量不能小于1')
    @Max(100, '每页数量不能超过100')
    limit: number = 10
}

// 导出 Schema 供前端使用
export const FindUserSchema = compileZodSchema(FindUserDto)
