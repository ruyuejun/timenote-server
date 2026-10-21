import { IsOptional, IsString } from 'src/libs/zod2'

/**
 * 文件上传 DTO
 *
 * @param subDir 子目录（可选），文件会上传至 {UPLOAD_DIR}/{subDir}/ 目录下
 */
export class UploadFileDto {
    @IsOptional()
    @IsString('子目录必须是字符串')
    subDir?: string
}
