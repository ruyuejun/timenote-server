import { Module } from '@nestjs/common'
import { BaseService } from './base.service'
import { BaseController } from './base.controller'
import { RegionDao } from './dao/region.dao'

@Module({
    controllers: [BaseController],
    providers: [BaseService, RegionDao],
    exports: [BaseService],
})
export class BaseModule {}
