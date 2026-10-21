import { int, varchar } from 'drizzle-orm/mysql-core'
import { createTable } from '../base-table'
import { InferSelectModel } from 'drizzle-orm'

export const roleTable = createTable('role', {
    id: int().primaryKey().autoincrement(),
    name: varchar({ length: 50 }).notNull().unique(), // e.g. 'admin', 'editor'
    description: varchar({ length: 255 }),
})

export type RoleSchema = InferSelectModel<typeof roleTable>
