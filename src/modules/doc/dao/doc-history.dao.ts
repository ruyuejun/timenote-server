import { Injectable } from '@nestjs/common'
import { TransactionHost } from '@nestjs-cls/transactional'
import { eq, like, type SQL } from 'drizzle-orm'
import { docHistoryTable } from 'src/db/schema/doc-history'
import { BaseDb } from 'src/libs/dbhelper'
import { FindDocHistoryDto } from '../dto/find-doc-history.dto'

@Injectable()
export class DocHistoryDao extends BaseDb<typeof docHistoryTable> {
    protected readonly table = docHistoryTable
    protected readonly idColumn = docHistoryTable.id

    constructor(transactionHost: TransactionHost) {
        super(transactionHost)
    }

    async find(dto: FindDocHistoryDto) {
        const conditions: SQL[] = []

        if (dto.did) {
            conditions.push(eq(docHistoryTable.did, dto.did))
        }

        if (dto.uid) {
            conditions.push(eq(docHistoryTable.uid, dto.uid))
        }

        if (dto.gid) {
            conditions.push(eq(docHistoryTable.gid, dto.gid))
        }

        if (dto.type) {
            conditions.push(eq(docHistoryTable.type, dto.type))
        }

        if (dto.vcode) {
            conditions.push(eq(docHistoryTable.vcode, dto.vcode))
        }

        if (dto.upuid) {
            conditions.push(eq(docHistoryTable.upuid, dto.upuid))
        }

        if (dto.name) {
            conditions.push(like(docHistoryTable.name, `%${dto.name}%`))
        }

        if (dto.vname) {
            conditions.push(like(docHistoryTable.vname, `%${dto.vname}%`))
        }

        if (dto.content) {
            conditions.push(like(docHistoryTable.content, `%${dto.content}%`))
        }

        return this.findConditions(conditions, {
            page: dto.page,
            limit: dto.limit,
        })
    }
}
