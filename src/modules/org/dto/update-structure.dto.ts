import { IsOptional, IsString, IsInt, Min, MaxLength } from 'src/libs/zod2'

/**
 * 更新组织架构节点 DTO
 *
 * @param pid      父节点ID（可选）
 * @param name     节点名称（可选）
 * @param code     节点编码（可选）
 * @param leader   负责人姓名（可选）
 */
export class UpdateStructureDto {
    @IsOptional()
    @IsInt('父节点ID必须是整数')
    @Min(0, '父节点ID最小值为0')
    pid?: number

    @IsOptional()
    @IsString('节点名称必须是字符串')
    @MaxLength(255, '节点名称不能超过255个字符')
    name?: string

    @IsOptional()
    @IsString('节点编码必须是字符串')
    @MaxLength(255, '节点编码不能超过255个字符')
    code?: string

    @IsOptional()
    @IsString('负责人姓名必须是字符串')
    @MaxLength(255, '负责人姓名不能超过255个字符')
    leader?: string
}
