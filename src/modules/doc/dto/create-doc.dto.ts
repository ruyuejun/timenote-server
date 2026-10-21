import {
    IsString,
    IsInt,
    Min,
    Max,
    MinLength,
    MaxLength,
    IsOptional,
    IsJson,
    IsNotEmpty,
    Type2Number,
    compileZodSchema,
} from 'src/libs/zod2/index'

export class CreateDocDto {
    @Type2Number()
    @IsNotEmpty('文档类型不能为空')
    @IsInt('文档类型必须是整数')
    @Min(0, '文档类型值不正确')
    @Max(2, '文档类型值不正确')
    type!: number

    @IsString('文件名必须是字符串')
    @MinLength(1, '文件名过短')
    @MaxLength(255, '文件名过长')
    name!: string

    @IsOptional()
    @Type2Number()
    @IsInt('父级文档 id 必须是整数')
    @Min(0, '父级文档 id 不能小于 0')
    pid?: number

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
    @IsInt('版本码必须是整数')
    @Min(0, '版本码不能小于 0')
    vcode?: number

    @IsOptional()
    @IsString('版本名必须是字符串')
    @MaxLength(255, '版本名长度不能超过 255')
    vname?: string

    @IsOptional()
    @IsString('内容必须是字符串')
    @IsJson('内容必须是合法的 JSON 字符串')
    content?: string
}

// 导出 Zod Schema 供前端使用
export const CreateDocSchema = compileZodSchema(CreateDocDto)
