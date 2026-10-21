import { ServiceResponse } from 'src/interfaces/service.type'

export interface FileUploadResult {
    /** 文件保存路径（相对于上传目录） */
    path: string
    /** 原始文件名 */
    originalname: string
    /** 文件大小（字节） */
    size: number
    /** MIME 类型 */
    mimetype: string
}

export type FileUploadVo = ServiceResponse<FileUploadResult>
