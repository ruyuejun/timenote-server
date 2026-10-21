import { Injectable } from '@nestjs/common'
import { CreateDocHistoryDto } from './dto/create-doc-history.dto'
import { DocHistoryDao } from './dao/doc-history.dao'
import { ServiceResponse } from 'src/interfaces/service.type'
import { R, ResponseBody } from 'src/config/code.config'
import { DocHistory } from './entities/doc-history.entity'
import { FindDocHistoryDto } from './dto/find-doc-history.dto'

@Injectable()
export class DocHistoryService {
    constructor(private readonly docHistoryDao: DocHistoryDao) {}

    async create(dto: CreateDocHistoryDto): ServiceResponse<DocHistory> {
        const raw1 = await this.docHistoryDao.create(dto)
        const raw2 = await this.docHistoryDao.findById(raw1[0].id)
        return R.success(raw2)
    }

    async find(dto: FindDocHistoryDto): Promise<ResponseBody<DocHistory>> {
        const { list, total } = await this.docHistoryDao.find(dto)
        return R.success(list, total)
    }
}
