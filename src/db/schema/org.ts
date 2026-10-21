import { int, tinyint, varchar, uniqueIndex } from 'drizzle-orm/mysql-core'
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm'
import { createTable } from '../base-table'

/**
 * 组织表（公司/企业）
 * - status: 1 启用 0 停用
 */
export const orgTable = createTable('org', {
    id: int().primaryKey().autoincrement(),
    name: varchar({ length: 255 }).notNull().default(''), // 组织名称
    shortName: varchar({ length: 255 }).notNull().default(''), // 组织简称
    code: varchar({ length: 255 }).notNull().default(''), // 组织编码/统一社会信用代码
    logo: varchar({ length: 255 }).notNull().default(''), // 组织 logo
    tel: varchar({ length: 255 }).notNull().default(''), // 联系电话
    email: varchar({ length: 255 }).notNull().default(''), // 联系邮箱
    address: varchar({ length: 255 }).notNull().default(''), // 组织地址
    status: tinyint().notNull().default(1), // 状态：1 启用 0 停用
})

export type OrgSchema = InferSelectModel<typeof orgTable>
export type OrgSchemaInsert = InferInsertModel<typeof orgTable>

// ========== 条件唯一索引 ==========
// 原理：MySQL 唯一索引自动忽略 NULL，利用这一特性实现"空值可重复，非空值必须唯一"
export const orgConditionalIndexes = [
    uniqueIndex('idx_org_code_cond').on(
        sql`CASE WHEN ${orgTable.code} = '' OR ${orgTable.code} IS NULL THEN NULL ELSE ${orgTable.code} END`
    ),
]
