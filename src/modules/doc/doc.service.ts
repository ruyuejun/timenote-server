import { Injectable } from '@nestjs/common'
import { CreateDocDto } from './dto/create-doc.dto'
import { UpdateDocDto } from './dto/update-doc.dto'
import { DocDao } from './dao/user.dao'
import type { ServiceResponse } from 'src/interfaces/service.type'
import { R, ResponseBody } from 'src/config/code.config'
import { Doc } from './entities/doc.entity'
import { FindDocDto } from './dto/find-doc.dto'
import { DocHistoryService } from './doc-history.service'
import { CreateDocHistoryDto } from './dto/create-doc-history.dto'
import { Transactional } from 'src/libs/dbhelper'

@Injectable()
export class DocService {
    constructor(
        private readonly docDao: DocDao,
        private readonly docHistoryService: DocHistoryService
    ) {}

    async create(dto: CreateDocDto): ServiceResponse<Doc> {
        const raw = await this.docDao.create(dto)
        const docs = await this.docDao.findById(raw[0].id)
        return R.success(docs)
    }

    async remove(id: number): ServiceResponse<never> {
        await this.docDao.delete(id)
        return R.success()
    }

    @Transactional()
    async update(dto: UpdateDocDto): ServiceResponse<never> {
        const existingDoc = await this.docDao.findById(dto.id)
        if (!existingDoc) {
            return R.errorNotFound()
        }

        await this.docDao.update(dto.id, dto)
        const raw = await this.docDao.findById(dto.id)
        if (raw.length <= 0) {
            throw new Error(`Document ${dto.id} disappeared during update`)
        }

        const doc = raw[0]
        const createDocHistoryDto: CreateDocHistoryDto = {
            did: doc.id,
            uid: doc.uid,
            gid: doc.gid,
            type: doc.type,
            name: doc.name,
            content: JSON.stringify(doc.content),
            vcode: doc.vcode,
            vname: doc.vname,
            upuid: 0,
        }
        await this.docHistoryService.create(createDocHistoryDto)

        return R.success()
    }

    @Transactional()
    async change(dto: UpdateDocDto): ServiceResponse<never> {
        const existingDoc = await this.docDao.findById(dto.id)
        if (!existingDoc) {
            return R.errorNotFound()
        }

        await this.docDao.update(dto.id, dto)
        const raw = await this.docDao.findById(dto.id)
        if (raw.length <= 0) {
            throw new Error(`Document ${dto.id} disappeared during update`)
        }

        const doc = raw[0]
        const createDocHistoryDto: CreateDocHistoryDto = {
            did: doc.id,
            uid: doc.uid,
            gid: doc.gid,
            type: doc.type,
            name: doc.name,
            content: JSON.stringify(doc.content),
            vcode: doc.vcode,
            vname: doc.vname,
            upuid: 0,
        }
        await this.docHistoryService.create(createDocHistoryDto)

        return R.success()
    }

    async find(dto: FindDocDto): Promise<ResponseBody<Doc>> {
        const { list, total } = await this.docDao.find(dto)
        return R.success(list, total)
    }

    async findPage(dto: FindDocDto): Promise<ResponseBody<Doc>> {
        const page = dto.page
        const limit = dto.limit
        const { list, total } = await this.docDao.findPage(page, limit)
        return R.success(list, total)
    }

    async findOne(id: number): Promise<ResponseBody<Doc>> {
        const raw = await this.docDao.findById(id)
        if (raw.length <= 0) {
            return R.errorNotFound()
        }
        return R.success(raw)
    }
}
