import { ArgumentsHost, Catch, HttpException } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import { AbstractHttpAdapter } from '@nestjs/core/adapters/http-adapter'
import { R } from 'src/config/code.config'

const loggedRequestErrors = new WeakSet<object>()

export function markRequestErrorAsLogged(error: unknown): void {
    if (typeof error === 'object' && error !== null) {
        loggedRequestErrors.add(error)
    }
}

export function isRequestErrorLogged(error: unknown): boolean {
    return typeof error === 'object' && error !== null && loggedRequestErrors.has(error)
}

@Catch()
export class RequestExceptionFilter extends BaseExceptionFilter {
    constructor(httpAdapter: AbstractHttpAdapter) {
        super(httpAdapter)
    }

    catch(exception: unknown, host: ArgumentsHost): void {
        if (!isRequestErrorLogged(exception)) {
            super.catch(exception, host)
            return
        }

        const http = host.switchToHttp()
        const response = http.getResponse()
        const statusCode = exception instanceof HttpException ? exception.getStatus() : 500
        const body =
            exception instanceof HttpException ? exception.getResponse() : { statusCode, message: R.errorServer().msg }

        response.status(statusCode).send(body)
    }
}
