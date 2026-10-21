import { and, eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'
import { TransactionHost } from '@nestjs-cls/transactional'
import { BaseDb } from 'src/libs/dbhelper'
import { orgStructureTable } from 'src/db/schema/org-structure'

@Injectable()
export class OrgStructureDao extends BaseDb<typeof orgStructureTable> {
    protected readonly table = orgStructureTable
    protected readonly idColumn = orgStructureTable.id

    constructor(transactionHost: TransactionHost) {
        super(transactionHost)
    }

    async findByPid(pid: number) {
        return this.getDb()
            .select()
            .from(this.table)
            .where(and(eq(orgStructureTable.pid, pid), eq(this.table.isDel, 1)))
    }
}
