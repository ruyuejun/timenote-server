import { InferSelectModel } from 'drizzle-orm'
import { int, varchar, index, mysqlTable } from 'drizzle-orm/mysql-core'

/**
 * 区县/县级市表（基础数据，无公共字段）
 *
 * 字段说明：
 * - id: 数据库自增主键
 * - area_id: 行政区划业务 id（国标 6 位编码）
 * - area_name: 区县名称
 * - pid: 父级 id（指向 base_city.id；0 表示顶级）
 */
export const baseAreaTable = mysqlTable(
    'base_area',
    {
        id: int().primaryKey().autoincrement(),
        areaId: int('area_id').notNull().unique(), // 行政区划业务 id（唯一）
        areaName: varchar('area_name', { length: 50 }).notNull(), // 区县名称
        pid: int().notNull().default(0), // 父级 city id，0 表示顶级
    },
    table => [
        // 用于按父级城市检索下属区县，以及按名称模糊检索
        index('idx_area_pid').on(table.pid),
        index('idx_area_name').on(table.areaName),
    ]
)

export type BaseAreaSchema = InferSelectModel<typeof baseAreaTable>
