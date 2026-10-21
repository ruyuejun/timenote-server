import { IsOptional, IsString, IsInt, Min, Max, MaxLength } from 'src/libs/zod2'

/**
 * 更新组织成员 DTO
 *
 * @param sid       所属架构节点ID（可选）
 * @param code      成员工号/编号（可选）
 * @param name      成员姓名（可选）
 * @param tel       手机号（可选）
 * @param email     邮箱（可选）
 * @param avatar    头像（可选）
 * @param gender    性别：0 未知 1 男 2 女（可选）
 * @param position  职位（可选）
 * @param status    状态：1 在职 0 离职（可选）
 */
export class UpdateMemberDto {
    @IsOptional()
    @IsInt('架构节点ID必须是整数')
    @Min(0, '架构节点ID最小值为0')
    sid?: number

    @IsOptional()
    @IsString('成员工号必须是字符串')
    @MaxLength(255, '成员工号不能超过255个字符')
    code?: string

    @IsOptional()
    @IsString('成员姓名必须是字符串')
    @MaxLength(255, '成员姓名不能超过255个字符')
    name?: string

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
