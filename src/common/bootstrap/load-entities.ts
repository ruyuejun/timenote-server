import { readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * 加载所有 entity 文件
 *
 * 目的：解决编译时剥离"仅用于类型注解"的 import，
 *       导致 @Exclude 装饰器未被注册的问题。
 *
 * 原理：显式 require 所有 entity 文件，触发顶层 __decorate 和 ExcludeRegistry 调用
 */
export function loadAllEntities(): void {
    const modulesDir = resolve(process.cwd(), 'dist', 'modules')
    try {
        const moduleDirs = readdirSync(modulesDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => join(modulesDir, d.name, 'entity'))

        for (const entityDir of moduleDirs) {
            try {
                const entityFiles = readdirSync(entityDir).filter(f => f.endsWith('.entity.js'))
                for (const file of entityFiles) {
                    require(join(entityDir, file))
                }
            } catch {
                // 某些模块可能没有 entity 目录
            }
        }
    } catch (err) {
        console.warn('Failed to scan entity files:', err)
    }
}
