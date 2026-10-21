import { Controller, Get, Post, Query, Req } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { BaseService } from './base.service'
import { ZodPipe } from 'src/libs/zod2'
import { FindProvinceDto, FindCityDto, FindAreaDto, FindStreetDto } from './dto/find-region.dto'
import { UploadFileDto } from './dto/upload-file.dto'
import type { CountryVo, ProvinceVo, CityVo, AreaVo, StreetVo } from './vo/region.vo'
import type { FileUploadVo } from './vo/upload.vo'

@Controller('base')
export class BaseController {
    constructor(private readonly baseService: BaseService) {}

    @Get('countries')
    async findCountries(): CountryVo {
        return await this.baseService.findCountries()
    }

    @Get('provinces')
    async findProvinces(@Query(new ZodPipe()) dto: FindProvinceDto): ProvinceVo {
        return await this.baseService.findProvinces(dto)
    }

    @Get('cities')
    async findCities(@Query(new ZodPipe()) dto: FindCityDto): CityVo {
        return await this.baseService.findCities(dto)
    }

    @Get('areas')
    async findAreas(@Query(new ZodPipe()) dto: FindAreaDto): AreaVo {
        return await this.baseService.findAreas(dto)
    }

    @Get('streets')
    async findStreets(@Query(new ZodPipe()) dto: FindStreetDto): StreetVo {
        return await this.baseService.findStreets(dto)
    }

    @Post('upload')
    async uploadFile(@Req() req: FastifyRequest, @Query(new ZodPipe()) dto: UploadFileDto): FileUploadVo {
        const file = await req.file()
        if (!file) {
            return { code: 400, msg: '请选择要上传的文件', data: [] }
        }
        return await this.baseService.uploadFile({
            filename: file.filename,
            file: file.file,
            mimetype: file.mimetype,
            fields: { subDir: dto.subDir },
        })
    }
}
