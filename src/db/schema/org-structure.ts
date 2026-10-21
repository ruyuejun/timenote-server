import { int, varchar } from 'drizzle-orm/mysql-core'
import { createTable } from '../base-table'
import { orgTable } from './org'
import { InferSelectModel } from 'drizzle-orm'

/**
 * 组织架构表（部门）
 * - 通过 pid 自引用实现层级结构，pid = 0 表示顶级架构节点
 * - 通过 oid 关联组织，删除组织时级联删除其下架构节点
 */
export const orgStructureTable = createTable('org_structure', {
    id: int().primaryKey().autoincrement(),
    oid: int()
        .notNull()
        .default(0)
        .references(() => orgTable.id, { onDelete: 'cascade' }), // 所属组织 id
    pid: int().notNull().default(0), // 父节点 id，0 表示顶级
    name: varchar({ length: 255 }).notNull().default(''), // 节点名称（如：技术部 / 前端组）
    code: varchar({ length: 255 }).notNull().default(''), // 节点编码
    leader: varchar({ length: 255 }).notNull().default(''), // 负责人姓名
})

export type OrgStructureSchema = InferSelectModel<typeof orgStructureTable>
export type OrgStructureTreeSchema = OrgStructureSchema & { children?: OrgStructureTreeSchema[] }
