import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RegionDao } from './dao/region.dao'
import { FindProvinceDto, FindCityDto, FindAreaDto, FindStreetDto } from './dto/find-region.dto'
import type { ServiceResponse } from 'src/interfaces/service.type'
import { R } from 'src/config/code.config'
import { BaseArea, BaseCity, BaseCountry, BaseProvince, BaseStreet } from './entities/region.entity'
import type { FileUploadResult } from './vo/upload.vo'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class BaseService {
    constructor(
        private readonly regionDao: RegionDao,
        private readonly configService: ConfigService
    ) {}

    async findCountries(): ServiceResponse<BaseCountry> {
        const list = await this.regionDao.findAllCountries()
        return R.success(list)
    }

    async findProvinces(_dto: FindProvinceDto): ServiceResponse<BaseProvince> {
        const list = await this.regionDao.findAllProvinces()
        return R.success(list)
    }

    async findCities(dto: FindCityDto): ServiceResponse<BaseCity> {
        const list = await this.regionDao.findCitiesByProvince(dto.provinceId)
        return R.success(list)
    }

    async findAreas(dto: FindAreaDto): ServiceResponse<BaseArea> {
        const list = await this.regionDao.findAreasByCity(dto.cityId)
        return R.success(list)
    }

    async findStreets(dto: FindStreetDto): ServiceResponse<BaseStreet> {
        const list = await this.regionDao.findStreetsByArea(dto.areaId)
        return R.success(list)
    }

    /**
     * 上传文件
     * @param file 上传的文件
     * @param subDir 子目录（可选），文件会上传至 {UPLOAD_DIR}/{subDir}/ 目录下
     */
    async uploadFile(file: {
        filename: string
        file: NodeJS.ReadableStream
        mimetype: string
        fields: { subDir?: string }
    }): ServiceResponse<FileUploadResult> {
        const uploadDir = this.configService.get<string>('UPLOAD_DIR') || 'uploads'
        const subDir = file.fields.subDir
        const targetDir = subDir ? path.join(uploadDir, subDir) : uploadDir

        // 创建目录（递归创建）
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
        }

        // 生成文件名（时间戳 + 原始文件名）
        const timestamp = Date.now()
        const ext = path.extname(file.filename)
        const baseName = path.basename(file.filename, ext)
        const newFileName = `${baseName}_${timestamp}${ext}`
        const filePath = path.join(targetDir, newFileName)

        // 将文件流写入磁盘
        const writeStream = fs.createWriteStream(filePath)
        await new Promise<void>((resolve, reject) => {
            file.file.pipe(writeStream)
            file.file.on('end', resolve)
            file.file.on('error', reject)
        })

        // 获取文件大小
        const stats = fs.statSync(filePath)

        // 返回相对路径
        const relativePath = subDir ? `${subDir}/${newFileName}` : newFileName

        return R.success([
            {
                path: relativePath,
                originalname: file.filename,
                size: stats.size,
                mimetype: file.mimetype,
            },
        ])
    }
}
