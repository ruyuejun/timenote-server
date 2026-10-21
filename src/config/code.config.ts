export interface ResponseBody<T = unknown> {
    code: number
    msg: string
    data: T[]
    timestamp?: string
    total?: number
    access_token?: string
    refresh_token?: string
}

export class R {
    static success<T>(data: T[] = [], total = 0): ResponseBody<T> {
        return this.createResponse(200, 'success', data, total)
    }

    // TODO:refreshToken
    static successAuth<T>(user: T, accessToken = '', _refreshToken = ''): ResponseBody<T> {
        return this.createResponse(200, 'success', [user], 1, accessToken)
    }

    static error<T = unknown>(code: number, msg: string): ResponseBody<T> {
        return this.createResponse(code, msg, [])
    }

    static errorAuth<T = unknown>(msg = ''): ResponseBody<T> {
        return this.error(2001, msg || '暂无权限')
    }

    static errorAuthNotFound<T = unknown>(msg = ''): ResponseBody<T> {
        return this.error(2002, msg || '用户不存在')
    }

    static errorAuthExist<T = unknown>(msg = ''): ResponseBody<T> {
        return this.error(2002, msg || '用户已存在')
    }

    static errorCreate<T = unknown>(msg = ''): ResponseBody<T> {
        return this.error(3001, msg || '创建失败')
    }

    static errorNotFound<T = unknown>(msg = ''): ResponseBody<T> {
        return this.error(4004, msg || '请求数据不存在')
    }

    static errorServer<T = unknown>(msg = ''): ResponseBody<T> {
        return this.error(5002, msg || '服务异常')
    }

    static createResponse<T>(code: number, msg: string, data: T[], total = 0, access_token = '', refresh_token = '') {
        let res: ResponseBody<T> = {
            code: code,
            msg: msg,
            data: data,
        }

        if (total) {
            res = {
                ...res,
                total: total,
            }
        }

        if (access_token) {
            res = {
                ...res,
                access_token: access_token,
            }
        }
        if (refresh_token) {
            res = {
                ...res,
                refresh_token: refresh_token,
            }
        }
        return res
    }
}
