import { Injectable } from '@nestjs/common'
import { OrgDao } from './dao/org.dao'
import { CreateOrgDto } from './dto/create-org.dto'
import { UpdateOrgDto } from './dto/update-org.dto'
import { R } from 'src/config/code.config'
import { ServiceResponse } from 'src/interfaces/service.type'
import { Org } from './entities/org.entity'

@Injectable()
export class OrgService {
    constructor(private readonly orgDao: OrgDao) {}

    async create(createOrgDto: CreateOrgDto): ServiceResponse<Org> {
        const raw = await this.orgDao.create(createOrgDto)
        const org = await this.orgDao.findById(raw[0].id)
        return R.success(org)
    }

    async findAll(): ServiceResponse<Org> {
        const list = await this.orgDao.findAll()
        return R.success(list)
    }

    async findPage(page: number, limit: number): ServiceResponse<Org> {
        const { list, total } = await this.orgDao.findPage(page, limit)
        return R.success(list, total)
    }

    async findOne(id: number): ServiceResponse<Org> {
        const org = await this.orgDao.findById(id)
        if (!org || org.length === 0) return R.errorNotFound('组织不存在')
        return R.success(org, 1)
    }

    async update(id: number, updateOrgDto: UpdateOrgDto): ServiceResponse<Org> {
        const existing = await this.orgDao.findById(id)
        if (!existing || existing.length === 0) return R.errorNotFound('组织不存在')

        await this.orgDao.update(id, updateOrgDto)
        const updated = await this.orgDao.findById(id)
        return R.success(updated)
    }

    async remove(id: number): ServiceResponse<Org> {
        const existing = await this.orgDao.findById(id)
        if (!existing || existing.length === 0) return R.errorNotFound('组织不存在')
        await this.orgDao.delete(id)
        return R.success()
    }
}
