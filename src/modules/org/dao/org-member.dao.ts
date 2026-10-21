import { Injectable } from '@nestjs/common'
import { TransactionHost } from '@nestjs-cls/transactional'
import { BaseDb } from 'src/libs/dbhelper'
import { orgMemberTable } from 'src/db/schema/org-member'

@Injectable()
export class OrgMemberDao extends BaseDb<typeof orgMemberTable> {
    protected readonly table = orgMemberTable
    protected readonly idColumn = orgMemberTable.id

    constructor(transactionHost: TransactionHost) {
        super(transactionHost)
    }
}
