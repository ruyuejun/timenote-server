import {
    IsString,
    IsInt,
    Min,
    Max,
    MinLength,
    MaxLength,
    IsJson,
    Type2Number,
    compileZodSchema,
} from 'src/libs/zod2/index'

export class CreateDocHistoryDto {
    @Type2Number()
    @IsInt('文档 id 必须是整数')
    @Min(0, '文档 id 不能小于 0')
    did!: number

    @Type2Number()
    @IsInt('用户 id 必须是整数')
    @Min(0, '用户 id 不能小于 0')
    uid?: number

    @Type2Number()
    @IsInt('组织/仓库 id 必须是整数')
    @Min(0, '组织/仓库 id 不能小于 0')
    gid!: number

    @Type2Number()
    @IsInt('文档类型必须是整数')
    @Min(0, '文档类型值不正确')
    @Max(2, '文档类型值不正确')
    type!: number

    @IsString('文件名必须是字符串')
    @MinLength(1, '文件名过短')
    @MaxLength(255, '文件名过长')
    name!: string

    @Type2Number()
    @IsInt('版本码必须是整数')
    @Min(0, '版本码不能小于 0')
    vcode!: number

    @IsString('版本名必须是字符串')
    @MaxLength(255, '版本名长度不能超过 255')
    vname!: string

    @IsString('内容必须是字符串')
    @IsJson('内容必须是合法的 JSON 字符串')
    content!: string

    @Type2Number()
    @IsInt('内容修改者 id 必须是整数')
    @Min(0, '内容修改者 id 不能小于 0')
    upuid!: number
}

// 导出 Zod Schema 供前端使用
export const CreateDocHistorySchema = compileZodSchema(CreateDocHistoryDto)
