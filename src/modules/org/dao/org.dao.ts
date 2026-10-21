import { Injectable } from '@nestjs/common'
import { TransactionHost } from '@nestjs-cls/transactional'
import { BaseDb } from 'src/libs/dbhelper'
import { orgTable } from 'src/db/schema/org'

@Injectable()
export class OrgDao extends BaseDb<typeof orgTable> {
    protected readonly table = orgTable
    protected readonly idColumn = orgTable.id

    constructor(transactionHost: TransactionHost) {
        super(transactionHost)
    }
}
