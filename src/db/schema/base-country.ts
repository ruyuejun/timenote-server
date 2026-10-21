import { InferSelectModel } from 'drizzle-orm'
import { int, char, varchar, uniqueIndex, index, mysqlTable } from 'drizzle-orm/mysql-core'

/**
 * 国家/地区表（基础数据，无公共字段）
 *
 * 数据来源：ISO 3166-1
 * - alpha2_code: 二位字母代码（如 CN、US）
 * - alpha3_code: 三位字母代码（如 CHN、USA）
 * - numeric_code: 三位数字代码（如 156、840）
 *
 * 注意：该表主键为 unsigned int（与其他 base_* 表不同）
 */
export const baseCountryTable = mysqlTable(
    'base_country',
    {
        id: int({ unsigned: true }).primaryKey().autoincrement(),
        alpha2Code: char('alpha2_code', { length: 2 }).notNull(), // ISO 3166-1 二位字母代码
        alpha3Code: char('alpha3_code', { length: 3 }).notNull(), // ISO 3166-1 三位字母代码
        numericCode: char('numeric_code', { length: 3 }).notNull(), // ISO 3166-1 三位数字代码
        countryName: varchar('country_name', { length: 100 }).notNull(), // 国家/地区全称
        countryShortName: varchar('country_short_name', { length: 50 }).notNull(), // 国家/地区简称
        countryEnglishName: varchar('country_english_name', { length: 100 }).notNull(), // 国家/地区英文名称
    },
    table => [
        uniqueIndex('idx_alpha2').on(table.alpha2Code),
        uniqueIndex('idx_alpha3').on(table.alpha3Code),
        uniqueIndex('idx_numeric').on(table.numericCode),
        index('idx_name').on(table.countryName),
        index('idx_english_name').on(table.countryEnglishName),
    ]
)

export type BaseCountrySchema = InferSelectModel<typeof baseCountryTable>
