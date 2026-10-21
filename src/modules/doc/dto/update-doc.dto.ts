import { PartialType } from '@nestjs/mapped-types'
import { CreateDocDto } from './create-doc.dto'
import { IsInt, IsNotEmpty, Type2Number } from 'src/libs/zod2'

export class UpdateDocDto extends PartialType(CreateDocDto) {
    @Type2Number()
    @IsNotEmpty('文档id不能为空')
    @IsInt('文档id必须是整数')
    id!: number
}
