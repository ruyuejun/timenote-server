import { Injectable } from '@nestjs/common'
import { TransactionHost } from '@nestjs-cls/transactional'
import { BaseDb } from 'src/libs/dbhelper'
import { eq, like, type SQL } from 'drizzle-orm'
import { FindDocDto } from '../dto/find-doc.dto'
import { docTable } from 'src/db/schema/doc'

@Injectable()
export class DocDao extends BaseDb<typeof docTable> {
    protected readonly table = docTable
    protected readonly idColumn = docTable.id

    constructor(transactionHost: TransactionHost) {
        super(transactionHost)
    }

    async find(dto: FindDocDto) {
        const conditions: SQL[] = []

        if (dto.pid !== undefined) {
            conditions.push(eq(docTable.pid, dto.pid))
        }

        if (dto.uid !== undefined) {
            conditions.push(eq(docTable.uid, dto.uid))
        }

        if (dto.gid !== undefined) {
            conditions.push(eq(docTable.gid, dto.gid))
        }

        if (dto.type !== undefined) {
            conditions.push(eq(docTable.type, dto.type))
        }

        if (dto.vcode !== undefined) {
            conditions.push(eq(docTable.vcode, dto.vcode))
        }

        if (dto.vname) {
            conditions.push(like(docTable.vname, `%${dto.vname}%`))
        }

        if (dto.name) {
            conditions.push(like(docTable.name, `%${dto.name}%`))
        }

        if (dto.content) {
            conditions.push(like(docTable.content, `%${dto.content}%`))
        }

        return this.findConditions(conditions, {
            page: dto.page,
            limit: dto.limit,
        })
    }
}
