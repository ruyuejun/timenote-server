import { IsString, IsInt, Min, Max, IsOptional, Type2Number, compileZodSchema } from 'src/libs/zod2'

export class FindDocHistoryDto {
    @IsOptional()
    @Type2Number()
    @IsInt('文档 id 必须是整数')
    @Min(0, '文档 id 不能小于 0')
    did?: number

    @IsOptional()
    @Type2Number()
    @IsInt('用户 id 必须是整数')
    @Min(0, '用户 id 不能小于 0')
    uid?: number

    @IsOptional()
    @Type2Number()
    @IsInt('组织/仓库 id 必须是整数')
    @Min(0, '组织/仓库 id 不能小于 0')
    gid?: number

    @IsOptional()
    @Type2Number()
    @IsInt('文档类型必须是整数')
    @Min(0, '文档类型值不正确')
    @Max(2, '文档类型值不正确')
    type?: number

    @IsOptional()
    @IsString('文件名必须是字符串')
    name?: string

    @IsOptional()
    @Type2Number()
    @IsInt('版本码必须是整数')
    @Min(0, '版本码不能小于 0')
    vcode?: number

    @IsOptional()
    @IsString('版本名必须是字符串')
    vname?: string

    @IsOptional()
    @IsString('内容必须是字符串')
    content?: string

    @IsOptional()
    @Type2Number()
    @IsInt('内容修改者 id 必须是整数')
    @Min(0, '内容修改者 id 不能小于 0')
    upuid?: number

    @IsOptional()
    @Type2Number()
    @IsInt('页码必须是整数')
    @Min(1, '页码不能小于1')
    page?: number = 1

    @IsOptional()
    @Type2Number()
    @IsInt('每页数量必须是整数')
    @Min(1, '每页数量不能小于1')
    @Max(100, '每页数量不能超过100')
    limit?: number = 10
}

// 导出 Schema 供前端使用
export const FindDocHistorySchema = compileZodSchema(FindDocHistoryDto)
