import { int, tinyint, mysqlTable, timestamp } from 'drizzle-orm/mysql-core'

const baseColumns = {
    isDel: tinyint('is_del').default(0).notNull(),
    addTime: timestamp('add_time').defaultNow().notNull(),
    updTime: timestamp('upd_time').notNull().defaultNow().onUpdateNow(),
    addUser: int('add_user').notNull().default(0),
    delUser: int('del_user').notNull().default(0),
}

/**
 * 创建带有公共字段（timestamps）的表
 * @param name 表名
 * @param columns 自定义列定义
 * @returns MySqlTable
 */
export function createTable<T extends Record<string, any>>(name: string, columns: T) {
    return mysqlTable(name, {
        ...columns,
        ...baseColumns,
    })
}
