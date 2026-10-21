import { describe, it, expect, beforeAll } from 'vitest'
import 'reflect-metadata'
import { firstValueFrom, of } from 'rxjs'
import { SerializeInterceptor } from '../src/common/interceptors/serialize.interceptor'
import { Exclude } from '../src/common/decorators/exclude.decorator'
import { R, type ResponseBody } from '../src/config/code.config'
import type { CallHandler, ExecutionContext } from '@nestjs/common'

class TestUser {
    id: number = 0
    username: string = ''
    add_time: Date = new Date()
    upd_time: Date = new Date()

    @Exclude()
    password: string = ''
}

let interceptor: SerializeInterceptor<unknown>

beforeAll(() => {
    interceptor = new SerializeInterceptor<unknown>()
})

/**
 * 调用拦截器并拿到最终处理结果（通过 rxjs 的 firstValueFrom 解包 Observable）。
 */
async function runInterceptor<T>(data: T): Promise<T> {
    const ctx = {} as ExecutionContext
    const handler: CallHandler = {
        handle: () => of(data),
    }
    const obs = interceptor.intercept(ctx, handler)
    return (await firstValueFrom(obs)) as T
}

describe('SerializeInterceptor - 基础行为', () => {
    it('应附加 timestamp 字段到标准响应体', async () => {
        const res: ResponseBody<{ a: number }> = { code: 200, msg: 'ok', data: [{ a: 1 }] }
        const result = await runInterceptor(res)

        expect(result.timestamp).toBeDefined()
        expect(typeof result.timestamp).toBe('string')
        expect(result.code).toBe(200)
    })

    it('应保持非标准响应体原样', async () => {
        const plain = { hello: 'world' }
        const result = await runInterceptor(plain)

        expect(result.hello).toBe('world')
    })
})

describe('SerializeInterceptor - 时间戳格式化', () => {
    it('应将 data 中对象的 add_time / upd_time 由 Date 格式化为字符串', async () => {
        const date = new Date('2024-05-10T08:30:45.000Z')
        const res: ResponseBody<TestUser> = {
            code: 200,
            msg: 'ok',
            data: [{ ...new TestUser(), id: 1, username: 'alice', add_time: date, upd_time: date }],
        }
        const result = await runInterceptor(res)

        expect(typeof result.data[0].add_time).toBe('string')
        expect(typeof result.data[0].upd_time).toBe('string')
        expect(result.data[0].add_time).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('应递归格式化嵌套对象的时间戳', async () => {
        const date = new Date('2024-01-02T03:04:05.000Z')
        const res = R.success([
            {
                id: 1,
                add_time: date,
                upd_time: date,
                profile: {
                    nickname: 'foo',
                    add_time: date,
                    upd_time: date,
                },
            },
        ])
        const result = await runInterceptor(res)

        expect(typeof result.data[0].add_time).toBe('string')
        expect(typeof result.data[0].profile.add_time).toBe('string')
        expect(typeof result.data[0].profile.upd_time).toBe('string')
    })

    it('应处理 add_time / upd_time 为 null / undefined 的情况', async () => {
        const res = R.success([
            {
                id: 1,
                add_time: null as unknown as Date,
                upd_time: undefined as unknown as Date,
            },
        ])
        const result = await runInterceptor(res)

        expect(result.data[0].add_time).toBeNull()
        expect(result.data[0].upd_time).toBeUndefined()
    })

    it('应处理数组中的多个对象', async () => {
        const date1 = new Date('2024-01-01T00:00:00.000Z')
        const date2 = new Date('2024-12-31T23:59:59.000Z')
        const res = R.success([
            { id: 1, add_time: date1, upd_time: date1 },
            { id: 2, add_time: date2, upd_time: date2 },
        ])
        const result = await runInterceptor(res)

        expect(typeof result.data[0].add_time).toBe('string')
        expect(typeof result.data[1].add_time).toBe('string')
    })
})

describe('SerializeInterceptor - @Exclude 字段过滤', () => {
    it('应移除被 @Exclude 标记的字段', async () => {
        const res: ResponseBody<TestUser> = {
            code: 200,
            msg: 'ok',
            data: [
                {
                    ...new TestUser(),
                    id: 1,
                    username: 'alice',
                    password: 'secret',
                    add_time: new Date('2024-05-10T08:30:45.000Z'),
                    upd_time: new Date('2024-05-10T08:30:45.000Z'),
                },
            ],
        }
        const result = await runInterceptor(res)

        expect(result.data[0].password).toBeUndefined()
        expect(result.data[0].username).toBe('alice')
    })
})
