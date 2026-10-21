import { int, json, tinyint, varchar } from 'drizzle-orm/mysql-core'
import { createTable } from '../base-table'
import { InferSelectModel } from 'drizzle-orm'

export const docHistoryTable = createTable('doc_history', {
    id: int().primaryKey().autoincrement(),
    did: int().notNull().default(0), // 文档id
    uid: int().notNull().default(0), // 用户id
    gid: int().notNull().default(0), // 组织/仓库id
    type: tinyint().notNull().default(0), // 1 文档 2 目录
    name: varchar({ length: 255 }).notNull().default(''),
    content: json().default({}),
    vcode: int().notNull().default(0),
    vname: varchar({ length: 255 }).notNull().default(''),
    upuid: int().notNull().default(0), // 内容修改者
})

export type DocHistorySchema = InferSelectModel<typeof docHistoryTable>
