import * as common from '@nestjs/common'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { Observable } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'
import { FastifyRequest, FastifyReply } from 'fastify'
import { markRequestErrorAsLogged } from '../filters/request-exception.filter'

@common.Injectable()
export class LoggerInterceptor implements common.NestInterceptor {
    constructor(
        @common.Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: common.LoggerService
    ) {}

    intercept(context: common.ExecutionContext, next: common.CallHandler): Observable<unknown> {
        const ctx = context.switchToHttp()
        const request = ctx.getRequest<FastifyRequest>()
        const response = ctx.getResponse<FastifyReply>()
        const controllerClass = context.getClass()
        const controllerName = controllerClass?.name ?? ''
        const suppressResponseLog = this.shouldSuppressResponseLog(controllerName)
        const { method, params, query, body } = request
        const url = request.url.replace(/\/+$/, '') || '/'
        const startedAt = performance.now()

        return next.handle().pipe(
            tap(data => {
                this.logger.log(
                    this.formatSuccessLog(
                        method,
                        url,
                        response.statusCode || 200,
                        request.ip,
                        params,
                        query,
                        body,
                        data,
                        performance.now() - startedAt,
                        suppressResponseLog
                    )
                )
            }),
            catchError(error => {
                this.logger.error(
                    this.formatErrorLog(
                        method,
                        url,
                        this.getStatusCode(error),
                        request.ip,
                        params,
                        query,
                        body,
                        error,
                        performance.now() - startedAt
                    )
                )
                markRequestErrorAsLogged(error)
                throw error
            })
        )
    }

    /**
     * 是否需要隐藏响应体日志。
     * 例如行政区划基础数据量大，res 字段会刷屏，通过控制器类名匹配后跳过。
     */
    private shouldSuppressResponseLog(controllerName: string): boolean {
        if (!controllerName) {
            return false
        }
        return controllerName === 'BaseController' || controllerName.endsWith('BaseController')
    }

    private formatSuccessLog(
        method: string,
        url: string,
        statusCode: number,
        ip: string | undefined,
        param: FastifyRequest['params'],
        query: FastifyRequest['query'],
        body: FastifyRequest['body'],
        response: unknown,
        duration: number,
        suppressResponseLog = false
    ): string {
        const paramsLine = `  params:${this.stringify(this.getRequestParams(param, query, body))}`
        if (suppressResponseLog) {
            return `${method} ${url} ${statusCode} +${Math.round(duration)}ms ${ip ?? ''}\n${paramsLine}`
        }
        return `${method} ${url} ${statusCode} +${Math.round(duration)}ms ${ip ?? ''}\n${paramsLine}\n  res:${this.stringify(response)}`
    }

    private formatErrorLog(
        method: string,
        url: string,
        statusCode: number,
        ip: string | undefined,
        param: FastifyRequest['params'],
        query: FastifyRequest['query'],
        body: FastifyRequest['body'],
        error: unknown,
        duration: number
    ): string {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorStack = error instanceof Error ? error.stack : undefined
        const errorCauses = this.formatErrorCauses(error)

        return `${method} ${url} ${statusCode} +${Math.round(duration)}ms ${ip ?? ''}\n  params:${this.stringify(
            this.getRequestParams(param, query, body)
        )}\n  err:${errorMessage}${errorCauses ? `\n  cause:${errorCauses}` : ''}${errorStack ? `\n  stack:${errorStack}` : ''}`
    }

    private formatErrorCauses(error: unknown): string | undefined {
        const causes: string[] = []
        const seen = new Set<unknown>()
        let current = error

        while (typeof current === 'object' && current !== null && !seen.has(current)) {
            seen.add(current)
            const errorRecord = current as Record<string, unknown>
            const cause = errorRecord.cause
            if (typeof cause !== 'object' || cause === null) {
                break
            }

            const causeRecord = cause as Record<string, unknown>
            const details = [
                typeof causeRecord.code === 'string' ? `code=${causeRecord.code}` : undefined,
                typeof causeRecord.errno === 'number' ? `errno=${causeRecord.errno}` : undefined,
                typeof causeRecord.sqlState === 'string' ? `sqlState=${causeRecord.sqlState}` : undefined,
                cause instanceof Error ? cause.message : undefined,
            ].filter((value): value is string => value !== undefined)

            if (details.length > 0) {
                causes.push(details.join(', '))
            }

            current = cause
        }

        return causes.length > 0 ? causes.join(' <- ') : undefined
    }

    private getRequestParams(
        param: FastifyRequest['params'],
        query: FastifyRequest['query'],
        body: FastifyRequest['body']
    ): Record<string, unknown> {
        return Object.fromEntries(Object.entries({ param, query, body }).filter(([, value]) => this.hasValues(value)))
    }

    private hasValues(value: unknown): boolean {
        return Array.isArray(value)
            ? value.length > 0
            : typeof value === 'object' && value !== null
              ? Object.keys(value).length > 0
              : value != null
    }

    private getStatusCode(error: unknown): number {
        return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
            ? error.status
            : 500
    }

    private stringify(value: unknown): string {
        const seen = new WeakSet<object>()

        return JSON.stringify(value ?? {}, (_key, currentValue) => {
            if (typeof currentValue === 'object' && currentValue !== null) {
                if (seen.has(currentValue)) {
                    return '[Circular]'
                }
                seen.add(currentValue)
            }

            return currentValue
        })
    }
}
