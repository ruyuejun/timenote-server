import { InferSelectModel } from 'drizzle-orm'
import { int, varchar, index, mysqlTable } from 'drizzle-orm/mysql-core'

/**
 * 省份/直辖市/自治区表（基础数据，无公共字段）
 *
 * 字段说明：
 * - id: 数据库自增主键
 * - province_id: 行政区划业务 id（国标 6 位编码的前 2 位）
 * - province_name: 省份名称
 * - wm: 省份名称的首字母缩写（五笔/字母简码）
 */
export const baseProvinceTable = mysqlTable(
    'base_province',
    {
        id: int().primaryKey().autoincrement(),
        provinceId: int('province_id').notNull().unique(), // 行政区划业务 id（唯一）
        provinceName: varchar('province_name', { length: 40 }).notNull(), // 省份名称
        wm: varchar({ length: 10 }).notNull().default(''), // 省份名称的首字母/五笔简码
    },
    table => [
        // name 上建普通索引用于检索（数据库原表使用 FULLTEXT，这里用普通索引保持轻量）
        index('idx_province_name').on(table.provinceName),
    ]
)

export type BaseProvinceSchema = InferSelectModel<typeof baseProvinceTable>
