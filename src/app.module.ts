import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ClsModule } from 'nestjs-cls'
import { ClsPluginTransactional } from '@nestjs-cls/transactional'
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm'
import { WinstonModule } from 'nest-winston'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { LoggerInterceptor } from './common/interceptors/logger.interceptor'
import { buildLogConfig } from './config/log.config'
import { envSchema } from './config/env.validation'
import { UserModule } from './modules/user/user.module'
import { AuthModule } from './modules/auth/auth.module'
import { DocModule } from './modules/doc/doc.module'
import { DrizzleModule, DRIZZLE } from './db/drizzle.module'
import { BaseModule } from './modules/base/base.module'
import { OrgModule } from './modules/org/org.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            envFilePath: [
                `.env.${process.env.NODE_ENV || 'development'}.local`,
                `.env.${process.env.NODE_ENV || 'development'}`,
                '.env.local',
                '.env',
            ],
            validate: (rawConfig: Record<string, unknown>) => {
                const parsed = envSchema.safeParse(rawConfig)
                if (!parsed.success) {
                    const message = parsed.error.issues
                        .map(e => `${e.path.join('.') || 'root'}: ${e.message}`)
                        .join('\n  ')
                    throw new Error(`Environment validation failed:\n  ${message}`)
                }
                return parsed.data
            },
        }),
        WinstonModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => buildLogConfig(config),
        }),
        ClsModule.forRoot({
            global: true,
            middleware: {
                mount: true,
            },
            plugins: [
                new ClsPluginTransactional({
                    imports: [DrizzleModule],
                    adapter: new TransactionalAdapterDrizzleOrm({
                        drizzleInstanceToken: DRIZZLE,
                    }),
                }),
            ],
        }),
        DrizzleModule,
        BaseModule,
        UserModule,
        AuthModule,
        DocModule,
        OrgModule,
    ],
    controllers: [],
    providers: [{ provide: APP_INTERCEPTOR, useClass: LoggerInterceptor }],
})
export class AppModule {}
