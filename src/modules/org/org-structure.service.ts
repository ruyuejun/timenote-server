import { Injectable } from '@nestjs/common'
import { CreateStructureDto } from './dto/create-structure.dto'
import { UpdateStructureDto } from './dto/update-structure.dto'
import { R } from 'src/config/code.config'
import { OrgStructure } from './entities/org-structure.entity'
import { OrgStructureDao } from './dao/org-structure.dao'
import { ServiceResponse } from 'src/interfaces/service.type'

@Injectable()
export class OrgStructureService {
    constructor(private readonly structureDao: OrgStructureDao) {}

    async create(createDto: CreateStructureDto): ServiceResponse<OrgStructure> {
        if (createDto.pid && createDto.pid > 0) {
            const parent = await this.structureDao.findById(createDto.pid)
            if (!parent || parent.length === 0) return R.errorNotFound('父节点不存在')
            if (parent[0].oid !== createDto.oid) return R.error(4001, '父节点不属于指定组织')
        }
        const raw = await this.structureDao.create(createDto)
        if (raw.length === 0) return R.errorCreate('创建组织架构节点失败')
        const result = await this.structureDao.findById(raw[0].id)
        return R.success(result)
    }

    async findAll(): ServiceResponse<OrgStructure> {
        const list = await this.structureDao.findAll()
        return R.success(list)
    }

    async findOne(id: number): ServiceResponse<OrgStructure> {
        const result = await this.structureDao.findById(id)
        if (!result || result.length === 0) return R.errorNotFound('组织架构节点不存在')
        return R.success(result)
    }

    async update(id: number, updateDto: UpdateStructureDto): ServiceResponse<OrgStructure> {
        const existing = await this.structureDao.findById(id)
        if (!existing || existing.length === 0) return R.errorNotFound('组织架构节点不存在')

        if (updateDto.pid !== undefined && updateDto.pid > 0) {
            if (updateDto.pid === id) return R.error(4001, '不能将自己设为父节点')
            const parent = await this.structureDao.findById(updateDto.pid)
            if (!parent || parent.length === 0) return R.errorNotFound('父节点不存在')
            if (parent[0].oid !== existing[0].oid) return R.error(4001, '父节点不属于指定组织')
        }

        await this.structureDao.update(id, updateDto)
        const updated = await this.structureDao.findById(id)
        return R.success(updated, 1)
    }

    async remove(id: number) {
        const existing = await this.structureDao.findById(id)
        if (!existing || existing.length === 0) return R.errorNotFound('组织架构节点不存在')

        const children = await this.structureDao.findByPid(id)
        if (children && children.length > 0) return R.error(4001, '该节点存在子节点，请先删除子节点')

        await this.structureDao.delete(id)
        return R.success()
    }
}
