import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { RequestExceptionFilter } from './common/filters/request-exception.filter'
import { SerializeInterceptor } from './common/interceptors/serialize.interceptor'
import { loadAllEntities } from './common/bootstrap/load-entities'
import fastifyMultipart from '@fastify/multipart'

// 必须在创建 Nest 应用前加载，确保 ExcludeRegistry 在拦截器运行前完成
loadAllEntities()

async function bootstrap() {
    const httpAdapter = new FastifyAdapter()

    // 注册 multipart 插件以支持文件上传
    await httpAdapter.getInstance().register(fastifyMultipart, {
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB
        },
    })

    const app = await NestFactory.create<NestFastifyApplication>(AppModule, httpAdapter, {})
    const config = app.get(ConfigService)

    app.setGlobalPrefix(config.get<string>('API_PREFIX')!)
    app.useGlobalInterceptors(new SerializeInterceptor())
    app.useGlobalFilters(new RequestExceptionFilter(httpAdapter))

    const port = config.get<number>('PORT')!
    await app.listen(port, '0.0.0.0')
    console.log(`Application is running on ${config.get('NODE_ENV')}: ${port}/${config.get('API_PREFIX')}`)
}

bootstrap()
