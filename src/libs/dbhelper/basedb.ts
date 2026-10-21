import {
    and,
    asc,
    count,
    eq,
    getColumns,
    sql,
    type InferInsertModel,
    type InferSelectModel,
    type SQL,
} from 'drizzle-orm'
import type { AnyMySqlColumn, AnyMySqlTable } from 'drizzle-orm/mysql-core'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import { Inject, Scope, Injectable, Optional } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import type { FastifyRequest } from 'fastify'
import type { TransactionHost } from '@nestjs-cls/transactional'

function omitUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
    return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Partial<T>
}

type OmitFields<T, K extends keyof T> = Omit<T, K>

/**
 * 当前登录用户的最小 payload，由 JwtGuard 写入 request.user
 * 写成 structural type，避免直接依赖 jwt 模块
 */
interface RequestUserPayload {
    sub?: number
}

@Injectable({ scope: Scope.REQUEST })
export abstract class BaseDb<
    TTable extends AnyMySqlTable,
    TSelect extends InferSelectModel<TTable> = InferSelectModel<TTable>,
    TInsert extends InferInsertModel<TTable> = InferInsertModel<TTable>,
    TId extends number | string = number,
> {
    protected abstract readonly table: TTable
    protected abstract readonly idColumn: AnyMySqlColumn

    /**
     * 注入 TransactionHost，由 NestJS DI 自动注入
     */
    constructor(
        protected readonly transactionHost: TransactionHost,
        @Optional() @Inject(REQUEST) private readonly request?: FastifyRequest & { user?: RequestUserPayload }
    ) {}

    /**
     * 获取当前的 db 实例（事务中返回事务 db，否则返回 fallback db）
     */
    protected getDb(): MySql2Database {
        return this.transactionHost.tx as MySql2Database
    }

    protected getFilteredColumns<K extends keyof TSelect>(excludeFields: K[] = []) {
        const allColumns = getColumns(this.table)
        const filteredColumns = { ...allColumns }

        excludeFields.forEach(field => {
            delete filteredColumns[field as string]
        })

        return filteredColumns
    }

    async create(data: TInsert) {
        return this.getDb()
            .insert(this.table)
            .values(omitUndefined(data as Record<string, unknown>) as TInsert)
            .$returningId()
    }

    async delete(id: TId): Promise<void> {
        const delUser = this.getCurrentUserId()
        await this.getDb()
            .update(this.table)
            .set({ isDel: true, delUser } as any)
            .where(eq(this.idColumn, id))
    }

    /**
     * 取当前登录用户 ID；未登录（如系统任务、CLI 脚本）回退为 0
     */
    private getCurrentUserId(): number {
        const sub = this.request?.user?.sub
        return typeof sub === 'number' ? sub : 0
    }

    async update(id: TId, data: Partial<TInsert>): Promise<void> {
        const cleanData = omitUndefined(data as Record<string, unknown>)
        if (Object.keys(cleanData).length === 0) {
            return
        }

        await this.getDb()
            .update(this.table)
            .set(cleanData as any)
            .where(eq(this.idColumn, id))
    }

    protected async findConditions<K extends keyof TSelect = never>(
        conditions: SQL[] = [],
        options?: { page?: number; limit?: number; excludeFields?: K[] }
    ): Promise<{ list: OmitFields<TSelect, K>[]; total: number }> {
        const isDelCondition = eq((this.table as any).isDel, false)
        const allConditions = [...conditions, isDelCondition]
        const whereClause = and(...allConditions)

        if (options?.page !== undefined && options?.limit !== undefined) {
            const safePage = Math.max(1, Math.floor(options.page))
            const safeLimit = Math.max(1, Math.floor(options.limit))
            const offset = (safePage - 1) * safeLimit

            let listQuery
            if (options.excludeFields?.length) {
                listQuery = this.getDb()
                    .select(this.getFilteredColumns(options.excludeFields) as any)
                    .from(this.table)
                    .where(whereClause)
                    .orderBy(asc(this.idColumn))
                    .limit(safeLimit)
                    .offset(offset)
            } else {
                listQuery = this.getDb()
                    .select()
                    .from(this.table)
                    .where(whereClause)
                    .orderBy(asc(this.idColumn))
                    .limit(safeLimit)
                    .offset(offset)
            }

            const [list, totalRow] = await Promise.all([
                listQuery,
                this.getDb().select({ value: count() }).from(this.table).where(whereClause),
            ])

            return { list: list as OmitFields<TSelect, K>[], total: Number(totalRow[0]?.value ?? 0) }
        }

        let list
        if (options?.excludeFields?.length) {
            list = await this.getDb()
                .select(this.getFilteredColumns(options.excludeFields) as any)
                .from(this.table)
                .where(whereClause)
                .orderBy(asc(this.idColumn))
        } else {
            list = await this.getDb().select().from(this.table).where(whereClause).orderBy(asc(this.idColumn))
        }

        return { list: list as OmitFields<TSelect, K>[], total: list.length }
    }

    async findById<K extends keyof TSelect = never>(
        id: TId,
        excludeFields?: K[]
    ): Promise<Array<OmitFields<TSelect, K>>> {
        let raw
        if (excludeFields?.length) {
            raw = await this.getDb()
                .select(this.getFilteredColumns(excludeFields) as any)
                .from(this.table)
                .where(and(eq(this.idColumn, id), eq((this.table as any).isDel, false)))
                .limit(1)
        } else {
            raw = await this.getDb()
                .select()
                .from(this.table)
                .where(and(eq(this.idColumn, id), eq((this.table as any).isDel, false)))
                .limit(1)
        }

        // return (raw[0] as OmitFields<TSelect, K>) ?? null
        return (raw as Array<OmitFields<TSelect, K>>) ?? []
    }

    async findPage<K extends keyof TSelect = never>(
        page: number,
        limit: number,
        excludeFields?: K[]
    ): Promise<{ list: OmitFields<TSelect, K>[]; total: number }> {
        const safePage = Math.max(1, Math.floor(page))
        const safeLimit = Math.max(1, Math.floor(limit))
        const offset = (safePage - 1) * safeLimit

        const whereClause = eq((this.table as any).isDel, false)

        let listQuery
        if (excludeFields?.length) {
            listQuery = this.getDb()
                .select(this.getFilteredColumns(excludeFields) as any)
                .from(this.table)
                .where(whereClause)
                .orderBy(asc(this.idColumn))
                .limit(safeLimit)
                .offset(offset)
        } else {
            listQuery = this.getDb()
                .select()
                .from(this.table)
                .where(whereClause)
                .orderBy(asc(this.idColumn))
                .limit(safeLimit)
                .offset(offset)
        }

        const [list, totalRow] = await Promise.all([
            listQuery,
            this.getDb().select({ value: count() }).from(this.table).where(whereClause),
        ])

        return { list: list as OmitFields<TSelect, K>[], total: Number(totalRow[0]?.value ?? 0) }
    }

    async findAll<K extends keyof TSelect = never>(excludeFields?: K[]): Promise<OmitFields<TSelect, K>[]> {
        if (excludeFields?.length) {
            return (await this.getDb()
                .select(this.getFilteredColumns(excludeFields) as any)
                .from(this.table)
                .where(eq((this.table as any).isDel, false))) as OmitFields<TSelect, K>[]
        } else {
            return (await this.getDb()
                .select()
                .from(this.table)
                .where(eq((this.table as any).isDel, false))) as OmitFields<TSelect, K>[]
        }
    }

    /**
     * 执行原生 SQL 语句
     * @param strings SQL 模板字符串（使用 ${value} 嵌入参数）
     * @param params 参数数组
     * @returns 查询结果
     * @example
     * const users = await this.execute<User[]>`SELECT * FROM users WHERE name = ${'zs'}`
     */
    protected async execute<T = any>(sqlTemplate: TemplateStringsArray, ...params: any[]): Promise<T> {
        const query = sql<T>(sqlTemplate, ...params)
        // drizzle mysql2 execute 返回的是 MySqlRawQueryResult = [rows, fields]
        // 这里解构出真正的数据行（索引 0），字段元数据（索引 1）丢弃
        const [rows] = await this.getDb().execute(query)
        return rows as T
    }

    // ============================================================
    // 原生事务 API
    // ============================================================

    /**
     * 在事务中执行回调（自动管理 commit/rollback）
     * 推荐使用方式，等价于 mysql2 的 beginTransaction + 自动 commit/rollback 封装
     *
     * @example
     * ```typescript
     * await this.transaction(async (db) => {
     *   await db.update(users).set({ balance: 100 }).where(eq(users.id, 1))
     *   await db.update(users).set({ balance: 200 }).where(eq(users.id, 2))
     * })
     * ```
     */
    protected async transaction<T>(callback: (db: MySql2Database) => Promise<T>): Promise<T> {
        return (await this.transactionHost.withTransaction(callback as any)) as T
    }

    /**
     * 在新事务中执行（即使外层已有事务也强制新建）
     */
    protected async transactionNew<T>(callback: (db: MySql2Database) => Promise<T>): Promise<T> {
        const { Propagation } = await import('@nestjs-cls/transactional')
        return (await this.transactionHost.withTransaction(Propagation.RequiresNew, callback as any)) as T
    }

    /**
     * 在无事务环境下执行（即使外层已有事务也临时挂起）
     */
    protected async withoutTransaction<T>(callback: () => Promise<T>): Promise<T> {
        return (await this.transactionHost.withoutTransaction(callback as any)) as T
    }

    /**
     * 判断当前是否在事务中
     */
    protected isTransactionActive(): boolean {
        return this.transactionHost.isTransactionActive()
    }
}
