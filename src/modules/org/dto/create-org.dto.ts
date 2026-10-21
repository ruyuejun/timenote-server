import { IsOptional, IsString, IsInt, Min, Max, MaxLength } from 'src/libs/zod2'

/**
 * 创建组织 DTO
 *
 * @param name        组织名称（必填）
 * @param shortName   组织简称（可选）
 * @param code        组织编码/统一社会信用代码（可选）
 * @param logo        组织 Logo（可选）
 * @param tel         联系电话（可选）
 * @param email       联系邮箱（可选）
 * @param address     组织地址（可选）
 * @param status      状态：1 启用 0 停用（可选，默认 1）
 */
export class CreateOrgDto {
    @IsString('组织名称必须是字符串')
    @MaxLength(255, '组织名称不能超过255个字符')
    name: string

    @IsOptional()
    @IsString('组织简称必须是字符串')
    @MaxLength(255, '组织简称不能超过255个字符')
    shortName?: string

    @IsOptional()
    @IsString('组织编码必须是字符串')
    @MaxLength(255, '组织编码不能超过255个字符')
    code?: string

    @IsOptional()
    @IsString('组织Logo必须是字符串')
    @MaxLength(255, '组织Logo不能超过255个字符')
    logo?: string

    @IsOptional()
    @IsString('联系电话必须是字符串')
    @MaxLength(255, '联系电话不能超过255个字符')
    tel?: string

    @IsOptional()
    @IsString('联系邮箱必须是字符串')
    @MaxLength(255, '联系邮箱不能超过255个字符')
    email?: string

    @IsOptional()
    @IsString('组织地址必须是字符串')
    @MaxLength(255, '组织地址不能超过255个字符')
    address?: string

    @IsOptional()
    @IsInt('状态必须是整数')
    @Min(0, '状态最小值为0')
    @Max(1, '状态只能是0或1')
    status?: number
}
