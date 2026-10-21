import { int } from 'drizzle-orm/mysql-core'
import { createTable } from '../base-table'
import { userTable } from './user'
import { roleTable } from './role'
import { InferSelectModel } from 'drizzle-orm'

// 用户-角色关联表
export const userRoleTable = createTable('user_role', {
    id: int().primaryKey().autoincrement(),
    uid: int()
        .notNull()
        .references(() => userTable.id, { onDelete: 'cascade' }),
    rid: int()
        .notNull()
        .references(() => roleTable.id, { onDelete: 'cascade' }),
})

export type UserRoleSchema = InferSelectModel<typeof userRoleTable>
