import { Injectable } from '@nestjs/common'
import { OrgMemberDao } from './dao/org-member.dao'
import { CreateMemberDto } from './dto/create-member.dto'
import { UpdateMemberDto } from './dto/update-member.dto'
import { R } from 'src/config/code.config'
import { ServiceResponse } from 'src/interfaces/service.type'
import { OrgMember } from './entities/org-member.entity'

@Injectable()
export class OrgMemberService {
    constructor(private readonly memberDao: OrgMemberDao) {}

    async create(createDto: CreateMemberDto): ServiceResponse<OrgMember> {
        const raw = await this.memberDao.create(createDto)
        if (raw.length <= 0) return R.errorCreate('创建组织成员失败')
        const result = await this.memberDao.findById(raw[0].id)
        return R.success(result)
    }

    async findAll(): ServiceResponse<OrgMember> {
        const list = await this.memberDao.findAll()
        return R.success(list, list.length)
    }

    async findPage(page: number, limit: number): ServiceResponse<OrgMember> {
        const { list, total } = await this.memberDao.findPage(page, limit)
        return R.success(list, total)
    }

    async findOne(id: number): ServiceResponse<OrgMember> {
        const result = await this.memberDao.findById(id)
        if (!result || result.length === 0) return R.errorNotFound('组织成员不存在')
        return R.success(result)
    }

    async update(id: number, updateDto: UpdateMemberDto): ServiceResponse<OrgMember> {
        const existing = await this.memberDao.findById(id)
        if (!existing || existing.length === 0) return R.errorNotFound('组织成员不存在')
        await this.memberDao.update(id, updateDto)
        const updated = await this.memberDao.findById(id)
        return R.success(updated)
    }

    async remove(id: number): ServiceResponse<OrgMember> {
        const existing = await this.memberDao.findById(id)
        if (!existing || existing.length === 0) return R.errorNotFound('组织成员不存在')
        await this.memberDao.delete(id)
        return R.success()
    }
}
