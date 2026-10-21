import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common'
import { ZodPipe } from 'src/libs/zod2'
import { DocService } from './doc.service'
import { CreateDocDto } from './dto/create-doc.dto'
import { UpdateDocDto } from './dto/update-doc.dto'
import { FindDocDto } from './dto/find-doc.dto'
import type { DocHistoryVo, DocVo } from './vo/doc.vo'
import { CreateDocHistoryDto } from './dto/create-doc-history.dto'
import { DocHistoryService } from './doc-history.service'
import { FindDocHistoryDto } from './dto/find-doc-history.dto'
import { JwtAuth } from 'src/common/decorators/jwt.decorator'

@JwtAuth()
@Controller('doc')
export class DocController {
    constructor(
        private readonly docService: DocService,
        private readonly docHistoryService: DocHistoryService
    ) {}

    @Post()
    create(@Body(new ZodPipe()) dto: CreateDocDto): DocVo {
        return this.docService.create(dto)
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.docService.remove(+id)
    }

    @Put()
    update(@Body(new ZodPipe()) dto: UpdateDocDto) {
        return this.docService.update(dto)
    }

    @Patch()
    change(@Body(new ZodPipe()) dto: UpdateDocDto) {
        return this.docService.change(dto)
    }

    @Get()
    async find(@Query(new ZodPipe()) dto: FindDocDto): DocVo {
        return await this.docService.find(dto)
    }

    @Get('page')
    async findPage(@Query(new ZodPipe()) dto: FindDocDto): DocVo {
        return await this.docService.findPage(dto)
    }

    @Get(':id')
    findOne(@Param('id') id: string): DocVo {
        return this.docService.findOne(+id)
    }

    @Post('history')
    createHistory(@Body(new ZodPipe()) dto: CreateDocHistoryDto): DocHistoryVo {
        return this.docHistoryService.create(dto)
    }

    @Get('history')
    async findHistory(@Query(new ZodPipe()) dto: FindDocHistoryDto): DocHistoryVo {
        return await this.docHistoryService.find(dto)
    }
}
