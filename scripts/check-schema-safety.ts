/**
 * scripts/check-schema-safety.ts
 *
 * 在 `db:sync` 前做一道预检，发现"schema 文件名/导出名"与"数据库表名"不一致时
 * 主动告警，避免 Drizzle 把新表当作"旧表重命名"而 DROP 数据。
 *
 * 工作原理：
 *   1) 读 src/db/schema/*.ts 的 mysqlTable('xxx', ...) 第一参数
 *   2) 连数据库读 SHOW TABLES
 *   3) 两边做差集：
 *      - schema 里有但库里没有 → 新增（safe）
 *      - 库里没有但 schema 里有 → 删除（destructive，需要确认）
 *      - 库里有但 schema 里没有 → 删除（destructive，最常见）
 *      - 两边都有但表名变了 → 重命名（destructive，必须走 db:rename）
 *
 * 用法：
 *   pnpm db:check
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const SCHEMA_DIR = join(process.cwd(), 'src/db/schema')

// ── 解析 schema 文件里的 mysqlTable('xxx', ...) ────────────────────
function parseSchemaTables(): Set<string> {
    const tables = new Set<string>()
    for (const f of readdirSync(SCHEMA_DIR)) {
        if (!f.endsWith('.ts')) continue
        const txt = readFileSync(join(SCHEMA_DIR, f), 'utf8')
        // 同时识别 mysqlTable('xxx', ...) 和 createTable('xxx', ...)
        const re = /(?:mysqlTable|createTable)\(\s*['"]([^'"]+)['"]/g
        for (const m of txt.matchAll(re)) tables.add(m[1])
    }
    return tables
}

// ── 查数据库所有表 ─────────────────────────────────────────────────
async function fetchDbTables(): Promise<Set<string>> {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL 未设置')
    const u = new URL(url)
    const m = (await import('mysql2/promise')).default
    const c = await m.createConnection({
        host: u.hostname,
        port: +u.port,
        user: u.username,
        password: u.password,
        database: u.pathname.slice(1),
    })
    const [rows] = (await c.query('SHOW TABLES')) as [Record<string, string>[], unknown]
    await c.end()
    const key = Object.keys(rows[0] ?? { Tables_in_db: 'Tables_in_' + u.pathname.slice(1) })[0]
    return new Set(rows.map(r => r[key]))
}

async function main() {
    const schemaTables = parseSchemaTables()
    const dbTables = await fetchDbTables()

    const added: string[] = [] // schema 有，库没有（安全）
    const removed: string[] = [] // 库有，schema 没有（破坏性）
    for (const t of schemaTables) if (!dbTables.has(t)) added.push(t)
    for (const t of dbTables) {
        if (t === '__drizzle_migrations') continue
        if (!schemaTables.has(t)) removed.push(t)
    }

    console.log('━━━ Schema 预检 ━━━\n')
    console.log(`schema 中声明的表：${schemaTables.size} 张`)
    console.log(`数据库中实际表：${dbTables.size - 1} 张（扣除 __drizzle_migrations）\n`)

    if (added.length === 0 && removed.length === 0) {
        console.log('✅ 无差异，可以直接 `pnpm db:sync`')
        return
    }

    if (added.length) {
        console.log('🟢 新增（safe）：')
        for (const t of added) console.log(`   + ${t}`)
        console.log()
    }

    if (removed.length) {
        console.log('🔴 消失（destructive）：')
        for (const t of removed) {
            console.log(`   - ${t}`)
        }
        console.log()
        console.log('⚠️  这些表在 schema 中不再声明，会被 DROP。请确认：')
        console.log('   · 是真的要删 → 直接 `pnpm db:sync:safe --force`')
        console.log('   · 是改表名 → 走 `pnpm db:rename <old> <new>` 双写')
    }

    if (removed.length) process.exit(1)
}

main().catch(e => {
    console.error('ERR:', e.message)
    process.exit(1)
})
