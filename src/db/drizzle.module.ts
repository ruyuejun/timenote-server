import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2'
import { createPool } from 'mysql2'

export const DRIZZLE = Symbol('DRIZZLE')

export type DrizzleDB = MySql2Database

@Global()
@Module({
    providers: [
        {
            provide: DRIZZLE,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const databaseUrl = config.getOrThrow<string>('DATABASE_URL')
                const client = createPool(databaseUrl)
                return drizzle({ client })
            },
        },
    ],
    exports: [DRIZZLE],
})
export class DrizzleModule {}
