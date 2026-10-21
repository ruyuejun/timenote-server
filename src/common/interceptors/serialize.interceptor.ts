import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ResponseBody } from 'src/config/code.config'
import { formatTimestamp } from '../utils/date.util'
import { getExcludedFields } from '../decorators/exclude.decorator'

// 需要在响应阶段统一格式化的标准时间戳字段名
// JS 端统一使用驼峰命名（与 drizzle schema timestamps / entity 字段保持一致）
const TIMESTAMP_FIELDS = ['addTime', 'updTime'] as const

/**
 * 全局序列化拦截器
 *
 * 功能：
 * 1. 给所有标准响应附加 timestamp
 * 2. 递归格式化被标准时间戳字段（add_time / upd_time）的 Date 值为字符串
 * 3. 递归移除被 @Exclude() 装饰器标记的字段
 *
 * 工作原理：
 * - 通过对象的 constructor 在注册表中查找 @Exclude 字段列表
 * - 如果对象是 plain object，则通过字段完全匹配识别对应的类
 */
@Injectable()
export class SerializeInterceptor<T> implements NestInterceptor<T, ResponseBody<T>> {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<ResponseBody<T>> {
        return next.handle().pipe(
            map(data => {
                if (data && typeof data === 'object' && 'code' in data && 'msg' in data && 'data' in data) {
                    data.timestamp = formatTimestamp()
                    data.data = this.transform(data.data) as ResponseBody<T>['data']
                    return data
                }

                if (data && typeof data === 'object') {
                    return this.transform(data) as ResponseBody<T>
                }

                return data
            })
        )
    }

    /**
     * 对响应体做统一转换：
     *   1) 格式化标准时间戳字段（add_time / upd_time）
     *   2) 移除被 @Exclude 标记的字段
     *   3) 递归处理嵌套对象和数组
     */
    private transform(data: unknown): unknown {
        if (data === null || data === undefined) return data

        if (Array.isArray(data)) {
            return data.map(item => this.transform(item))
        }

        if (!(data instanceof Object) || data instanceof Date) {
            return data
        }

        const obj = data as Record<string, unknown> & { constructor?: object }
        const result: Record<string, unknown> = { ...obj }

        // 1) 格式化时间戳字段
        for (const field of TIMESTAMP_FIELDS) {
            if (field in result && result[field] != null) {
                result[field] = formatDateLike(result[field])
            }
        }

        // 2) 移除被 @Exclude 标记的字段
        const excludedFields = getExcludedFields(obj)
        excludedFields.forEach(field => {
            if (field in result) {
                delete result[field]
            }
        })

        // 3) 递归处理剩余字段
        for (const key of Object.keys(result)) {
            const value = result[key]
            if (value && typeof value === 'object') {
                result[key] = this.transform(value)
            }
        }

        return result
    }
}

/**
 * 把 Date / string / number 统一格式化为 YYYY-MM-DD HH:mm:ss 字符串；
 * 其它类型或解析失败则原样返回。
 */
function formatDateLike(value: unknown): string | null | unknown {
    if (value instanceof Date) {
        return formatTimestamp(value)
    }

    if (typeof value === 'string' || typeof value === 'number') {
        const d = new Date(value)
        if (!isNaN(d.getTime())) {
            return formatTimestamp(d)
        }
    }

    return value
}
