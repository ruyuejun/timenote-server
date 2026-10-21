/**
 *
 * 安全的 schema 同步脚本：generate → 扫描破坏性操作 → migrate
 *
 * 用法：
 *   pnpm db:sync:safe               # 全流程
 *   pnpm db:sync:safe --skip-generate  # 跳过 generate
 *   pnpm db:sync:safe --force       # 允许破坏性操作（确认数据已备份）
 *
 * 检测到的破坏性操作：
 *   - DROP TABLE
 *   - DROP COLUMN (ALTER TABLE ... DROP ...)
 *   - TRUNCATE TABLE
 *
 * 这些操作不可逆，发现后默认 exit 1，需要：
 *   1) 加 --force 强制执行（确认数据已备份/可丢），或
 *   2) 走 `pnpm db:rename <old> <new>` 双写迁移流程（无损重命名）
 */
import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DRIZZLE_DIR = join(process.cwd(), 'drizzle')

const args = process.argv.slice(2)
const skipGenerate = args.includes('--skip-generate')
const force = args.includes('--force')

// ── 破坏性操作检测 ─────────────────────────────────────────────────
type Severity = 'safe' | 'destructive'
interface Finding {
    severity: Severity
    line: number
    statement: string
    reason: string
}

// 用宽松正则：允许前导空白、IF EXISTS、可选反引号
const DROP_TABLE_RE = /^\s*DROP\s+TABLE\s+(IF\s+EXISTS\s+)?`?(\w+)`?\s*(?:;|$)/im
const DROP_COLUMN_RE = /^\s*ALTER\s+TABLE\s+`?(\w+)`?\s+DROP\s+(?:COLUMN\s+)?`?(\w+)`?/im
const TRUNCATE_RE = /^\s*TRUNCATE\s+(?:TABLE\s+)?`?(\w+)`?\s*(?:;|$)/im

function inspectSql(sql: string): Finding[] {
    const findings: Finding[] = []
    const lines = sql.split('\n')

    lines.forEach((line, idx) => {
        if (DROP_TABLE_RE.test(line)) {
            const m = line.match(DROP_TABLE_RE)
            findings.push({
                severity: 'destructive',
                line: idx + 1,
                statement: line.trim(),
                reason: `删除整张表 \`${m?.[2]}\` 会清空所有数据，不可恢复`,
            })
        }
        if (DROP_COLUMN_RE.test(line)) {
            const m = line.match(DROP_COLUMN_RE)
            findings.push({
                severity: 'destructive',
                line: idx + 1,
                statement: line.trim(),
                reason: `删除字段 \`${m?.[2]}\` 会丢失该列所有数据`,
            })
        }
        if (TRUNCATE_RE.test(line)) {
            const m = line.match(TRUNCATE_RE)
            findings.push({
                severity: 'destructive',
                line: idx + 1,
                statement: line.trim(),
                reason: `TRUNCATE \`${m?.[1]}\` 会清空整张表`,
            })
        }
    })
    return findings
}

// ── 列出所有迁移文件 ───────────────────────────────────────────────
function listMigrationFiles(): string[] {
    try {
        return readdirSync(DRIZZLE_DIR)
            .filter(f => /^\d{14}_/.test(f))
            .sort()
            .map(f => join(DRIZZLE_DIR, f, 'migration.sql'))
    } catch {
        return []
    }
}

// ── 主流程 ─────────────────────────────────────────────────────────
async function main() {
    // 1) generate
    console.log('📋 步骤 1/3：生成迁移 SQL')
    if (!skipGenerate) {
        const r = spawnSync('pnpm', ['drizzle-kit', 'generate'], {
            stdio: 'inherit',
            env: process.env,
        })
        if (r.status !== 0) {
            console.error('❌ drizzle-kit generate 失败')
            process.exit(r.status ?? 1)
        }
    } else {
        console.log('⏭️  跳过 generate (--skip-generate)')
    }

    // 2) 扫描
    console.log('\n📋 步骤 2/3：扫描破坏性操作')
    const migrationFiles = listMigrationFiles()

    if (migrationFiles.length === 0) {
        console.log('✅ drizzle/ 目录里没有迁移文件')
        return
    }

    // 我们没有可靠的「判断是否已跑」的办法（drizzle-kit 的 hash 算法未公开），
    // 所以**扫描所有迁移文件**，把已跑过的也扫一遍——已跑过的不会再执行，
    // 扫描是只读的，不会有副作用。
    const findings: { file: string; findings: Finding[] }[] = []
    for (const file of migrationFiles) {
        const sql = readFileSync(file, 'utf8')
        const f = inspectSql(sql)
        if (f.length) findings.push({ file, findings: f })
    }

    if (findings.length === 0) {
        console.log('✅ 扫描通过：无破坏性操作')
    } else {
        console.log('\n⚠️  发现可能的破坏性操作：\n')
        for (const { file, findings: fs } of findings) {
            console.log(`  📦 ${file.replace(process.cwd() + '/', '')}`)
            for (const f of fs) {
                console.log(`     · [${f.severity}] line ${f.line}: ${f.statement.slice(0, 120)}`)
                console.log(`       原因：${f.reason}\n`)
            }
        }
        if (!force) {
            console.log('🚫 已拦截。请确认：')
            console.log('   · 数据可以丢 → 加 --force 重跑')
            console.log('   · 数据不能丢 → 走 pnpm db:rename <old> <new> 双写迁移')
            process.exit(1)
        }
        console.log('⚠️  --force 已设置，继续执行（请确认数据已备份）')
    }

    // 3) migrate
    console.log('\n📋 步骤 3/3：执行 migrate')
    const r = spawnSync('pnpm', ['drizzle-kit', 'migrate'], {
        stdio: 'inherit',
        env: process.env,
    })
    process.exit(r.status ?? 0)
}

main().catch(e => {
    console.error('ERR:', e)
    process.exit(1)
})
