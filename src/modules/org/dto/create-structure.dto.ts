import { IsOptional, IsString, IsInt, Min, MaxLength } from 'src/libs/zod2'

/**
 * 创建组织架构节点 DTO
 *
 * @param oid      所属组织ID（必填）
 * @param pid      父节点ID（可选，默认0表示顶级节点）
 * @param name     节点名称（必填）
 * @param code     节点编码（可选）
 * @param leader   负责人姓名（可选）
 */
export class CreateStructureDto {
    @IsInt('组织ID必须是整数')
    @Min(1, '组织ID最小值为1')
    oid: number

    @IsOptional()
    @IsInt('父节点ID必须是整数')
    @Min(0, '父节点ID最小值为0')
    pid?: number

    @IsString('节点名称必须是字符串')
    @MaxLength(255, '节点名称不能超过255个字符')
    name: string

    @IsOptional()
    @IsString('节点编码必须是字符串')
    @MaxLength(255, '节点编码不能超过255个字符')
    code?: string

    @IsOptional()
    @IsString('负责人姓名必须是字符串')
    @MaxLength(255, '负责人姓名不能超过255个字符')
    leader?: string
}
