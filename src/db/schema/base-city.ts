import { InferSelectModel } from 'drizzle-orm'
import { int, varchar, index, mysqlTable } from 'drizzle-orm/mysql-core'

/**
 * 城市/地区表（基础数据，无公共字段）
 *
 * 字段说明：
 * - id: 数据库自增主键
 * - city_id: 行政区划业务 id（国标 6 位编码的前 4 位）
 * - city_name: 城市名称
 * - pid: 父级 id（指向 base_province.id；0 表示顶级）
 */
export const baseCityTable = mysqlTable(
    'base_city',
    {
        id: int().primaryKey().autoincrement(),
        cityId: int('city_id').notNull().unique(), // 行政区划业务 id（唯一）
        cityName: varchar('city_name', { length: 50 }).notNull(), // 城市名称
        pid: int('pid').notNull().default(0), // 父级 province id，0 表示顶级
    },
    table => [
        // 用于按父级省份检索下属城市，以及按名称模糊检索
        index('idx_city_pid').on(table.pid),
        index('idx_city_name').on(table.cityName),
    ]
)

export type BaseCitySchema = InferSelectModel<typeof baseCityTable>
