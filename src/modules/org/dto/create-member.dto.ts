import { IsOptional, IsString, IsInt, Min, Max, MaxLength } from 'src/libs/zod2'

/**
 * 创建组织成员 DTO
 *
 * @param oid       所属组织ID（必填）
 * @param sid       所属架构节点ID（可选，默认0表示未分配）
 * @param code      成员工号/编号（可选）
 * @param name      成员姓名（必填）
 * @param tel       手机号（可选）
 * @param email     邮箱（可选）
 * @param avatar    头像（可选）
 * @param gender    性别：0 未知 1 男 2 女（可选，默认0）
 * @param position  职位（可选）
 * @param status    状态：1 在职 0 离职（可选，默认1）
 */
export class CreateMemberDto {
    @IsInt('组织ID必须是整数')
    @Min(1, '组织ID最小值为1')
    oid: number

    @IsOptional()
    @IsInt('架构节点ID必须是整数')
    @Min(0, '架构节点ID最小值为0')
    sid?: number

    @IsOptional()
    @IsString('成员工号必须是字符串')
    @MaxLength(255, '成员工号不能超过255个字符')
    code?: string

    @IsString('成员姓名必须是字符串')
    @MaxLength(255, '成员姓名不能超过255个字符')
    name: string

    @IsOptional()
    @IsString('手机号必须是字符串')
    @MaxLength(255, '手机号不能超过255个字符')
    tel?: string

    @IsOptional()
    @IsString('邮箱必须是字符串')
    @MaxLength(255, '邮箱不能超过255个字符')
    email?: string

    @IsOptional()
    @IsString('头像必须是字符串')
    @MaxLength(255, '头像不能超过255个字符')
    avatar?: string

    @IsOptional()
    @IsInt('性别必须是整数')
    @Min(0, '性别最小值为0')
    @Max(2, '性别只能是0、1或2')
    gender?: number

    @IsOptional()
    @IsString('职位必须是字符串')
    @MaxLength(255, '职位不能超过255个字符')
    position?: string

    @IsOptional()
    @IsInt('状态必须是整数')
    @Min(0, '状态最小值为0')
    @Max(1, '状态只能是0或1')
    status?: number
}
