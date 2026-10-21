import { int, tinyint, varchar, uniqueIndex } from 'drizzle-orm/mysql-core'
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm'
import { createTable } from '../base-table'
import { orgTable } from './org'
import { orgStructureTable } from './org-structure'

/**
 * 组织成员表（员工）
 * - 通过 oid 关联组织
 * - 通过 sid 关联组织架构节点（可空：未分配时为 0）
 * - 成员离职/转岗时 sid 可置 0
 */
export const orgMemberTable = createTable('org_member', {
    id: int().primaryKey().autoincrement(),
    oid: int()
        .notNull()
        .default(0)
        .references(() => orgTable.id, { onDelete: 'cascade' }), // 所属组织 id
    sid: int()
        .notNull()
        .default(0)
        .references(() => orgStructureTable.id, { onDelete: 'set default' }), // 所属架构节点 id，0 表示未分配
    code: varchar({ length: 255 }).notNull().default(''), // 成员工号/编号
    name: varchar({ length: 255 }).notNull().default(''), // 成员姓名
    tel: varchar({ length: 255 }).notNull().default(''), // 手机号
    email: varchar({ length: 255 }).notNull().default(''), // 邮箱
    avatar: varchar({ length: 255 }).notNull().default(''), // 头像
    gender: tinyint().notNull().default(0), // 性别：0 未知 1 男 2 女
    position: varchar({ length: 255 }).notNull().default(''), // 职位
    status: tinyint().notNull().default(1), // 状态：1 在职 0 离职
})

export type OrgMemberSchema = InferSelectModel<typeof orgMemberTable>
export type OrgMemberSchemaInsert = InferInsertModel<typeof orgMemberTable>

// ========== 条件唯一索引 ==========
// 原理：MySQL 唯一索引自动忽略 NULL，利用这一特性实现"空值可重复，非空值必须唯一"
export const orgMemberConditionalIndexes = [
    uniqueIndex('idx_org_member_code_cond').on(
        sql`CASE WHEN ${orgMemberTable.code} = '' OR ${orgMemberTable.code} IS NULL THEN NULL ELSE ${orgMemberTable.code} END`
    ),
    uniqueIndex('idx_org_member_tel_cond').on(
        sql`CASE WHEN ${orgMemberTable.tel} = '' OR ${orgMemberTable.tel} IS NULL THEN NULL ELSE ${orgMemberTable.tel} END`
    ),
]
