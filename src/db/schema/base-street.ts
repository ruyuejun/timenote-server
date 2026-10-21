import { InferSelectModel } from 'drizzle-orm'
import { int, varchar, index, mysqlTable } from 'drizzle-orm/mysql-core'

/**
 * 乡镇/街道表（基础数据，无公共字段，无外键）
 *
 * 数据特征：
 * - 使用 6 位行政区划代码作为字符串存储（不足 6 位补 0，如 "110101"）
 * - father: 父级区县的 6 位行政区划代码（指向 base_area.area_id，但保持 varchar 不做 FK）
 * - 注意：father 是字符串类型，不要与 base_area.id 混用
 *
 * 字段说明：
 * - id: 数据库自增主键
 * - street_name: 街道/乡镇名称
 * - father: 父级区县的 6 位行政区划代码（varchar(6)）
 * - street_id: 街道/乡镇本身的 9 位行政区划代码（varchar(50)，可能含扩展位）
 */
export const baseStreetTable = mysqlTable(
    'base_street',
    {
        id: int().primaryKey().autoincrement(),
        streetName: varchar('street_name', { length: 60 }).notNull().default(''), // 街道/乡镇名称
        father: varchar('father', { length: 6 }).notNull().default(''), // 父级区县 6 位行政区划代码
        streetId: varchar('street_id', { length: 50 }).notNull().default(''), // 街道/乡镇 9 位行政区划代码
    },
    table => [
        // 用于按父级区县检索下属街道，以及按名称模糊检索
        index('idx_street_father').on(table.father),
        index('idx_street_name').on(table.streetName),
    ]
)

export type BaseStreetSchema = InferSelectModel<typeof baseStreetTable>
