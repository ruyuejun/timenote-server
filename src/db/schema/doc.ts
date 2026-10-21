import { int, json, tinyint, varchar } from 'drizzle-orm/mysql-core'
import { createTable } from '../base-table'
import { InferSelectModel } from 'drizzle-orm'

export const docTable = createTable('doc', {
    id: int().primaryKey().autoincrement(),
    pid: int().notNull().default(0),
    uid: int().notNull().default(0), // 用户
    gid: int().notNull().default(0), // 组织/仓库
    type: tinyint().notNull().default(0), // 1 文档 2 目录
    name: varchar({ length: 255 }).notNull().default(''),
    content: json().default({}),
    vcode: int().notNull().default(0),
    vname: varchar({ length: 255 }).notNull().default(''),
})

export type DocSchema = InferSelectModel<typeof docTable>
