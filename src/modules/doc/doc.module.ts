import { Module } from '@nestjs/common'
import { DocService } from './doc.service'
import { DocController } from './doc.controller'
import { DocDao } from './dao/user.dao'
import { DocHistoryDao } from './dao/doc-history.dao'
import { DocHistoryService } from './doc-history.service'

@Module({
    controllers: [DocController],
    providers: [DocService, DocHistoryService, DocDao, DocHistoryDao],
    exports: [DocService, DocHistoryService],
})
export class DocModule {}
