import { int, tinyint, varchar, uniqueIndex } from 'drizzle-orm/mysql-core'
import { InferSelectModel, sql } from 'drizzle-orm'
import { createTable } from '../base-table'

export const userTable = createTable('user', {
    id: int().primaryKey().autoincrement(),
    openid: varchar({ length: 255 }).notNull().default(''),
    username: varchar({ length: 255 }).notNull().default(''),
    password: varchar({ length: 255 }).notNull().default(''),
    tel: varchar({ length: 255 }).notNull().default(''),
    email: varchar({ length: 255 }).notNull().default(''),
    nickname: varchar({ length: 255 }).notNull().default(''),
    avatar: varchar({ length: 255 }).notNull().default(''),
    gender: tinyint().notNull().default(0),
    birth: varchar({ length: 255 }).notNull().default(''),
})

export type UserSchema = InferSelectModel<typeof userTable>

// ========== 条件唯一索引 ==========
// 原理：MySQL 唯一索引自动忽略 NULL，利用这一特性实现"空值可重复，非空值必须唯一"
// - openid / username 为空字符串时 → CASE WHEN 返回 NULL → 不触发唯一约束
// - openid / username 为非空值时 → CASE WHEN 返回原值 → 唯一约束生效
export const userConditionalIndexes = [
    uniqueIndex('idx_user_openid_cond').on(
        sql`CASE WHEN ${userTable.openid} = '' OR ${userTable.openid} IS NULL THEN NULL ELSE ${userTable.openid} END`
    ),

    uniqueIndex('idx_user_username_cond').on(
        sql`CASE WHEN ${userTable.username} = '' OR ${userTable.username} IS NULL THEN NULL ELSE ${userTable.username} END`
    ),
]
