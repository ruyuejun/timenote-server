/**
 * scripts/rename-table.ts
 *
 * 双写迁移助手：把旧表 `company` 改名为 `org`，数据不丢。
 *
 * 用法：
 *   pnpm db:rename <old_table> <new_table>
 *   pnpm db:rename --column <table> <old_col> <new_col>
 *
 * 工作流程（以 `pnpm db:rename company org` 为例）：
 *
 *   阶段 1：准备双写
 *     CREATE TABLE org LIKE company;
 *     ALTER TABLE org ... (应用新结构)
 *     INSERT INTO org SELECT ... FROM company;  (迁移已有数据)
 *
 *   阶段 2：应用切流（手动在 README 里有说明）
 *     - 业务层先 INSERT/SELECT 同时写 org 和 company
 *     - 验证数据一致后，切到只写 org
 *
 *   阶段 3：清理
 *     DROP TABLE company;
 *
 * 本脚本只生成阶段 1 的 SQL，由你手动审阅后再执行。
 */

type Cmd =
    | { kind: 'rename-table'; old: string; new: string }
    | { kind: 'rename-column'; table: string; old: string; new: string }
    | null

function parseArgs(argv: string[]): Cmd {
    const a = argv.slice(2)
    if (a[0] === '--column') {
        const [, , table, oldCol, newCol] = a
        if (!table || !oldCol || !newCol) {
            console.error('用法: pnpm db:rename --column <table> <old_col> <new_col>')
            return null
        }
        return { kind: 'rename-column', table, old: oldCol, new: newCol }
    }
    if (a.length === 2) {
        return { kind: 'rename-table', old: a[0], new: a[1] }
    }
    console.error('用法:')
    console.error('  pnpm db:rename <old_table> <new_table>')
    console.error('  pnpm db:rename --column <table> <old_col> <new_col>')
    return null
}

function banner(title: string) {
    const line = '─'.repeat(60)
    console.log(`\n${line}\n${title}\n${line}\n`)
}

function ts(): string {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return (
        d.getFullYear() +
        pad(d.getMonth() + 1) +
        pad(d.getDate()) +
        pad(d.getHours()) +
        pad(d.getMinutes()) +
        pad(d.getSeconds())
    )
}

function main() {
    const cmd = parseArgs(process.argv)
    if (!cmd) process.exit(1)

    if (cmd.kind === 'rename-table') {
        const { old: oldT, new: newT } = cmd
        banner(`双写迁移：${oldT} → ${newT}`)

        const lines: string[] = [
            `-- ⚠️  本文件由 scripts/rename-table.ts 自动生成`,
            `-- 用途：把表 \`${oldT}\` 的数据无损迁移到 \`${newT}\``,
            `-- 时间：${new Date().toISOString()}`,
            ``,
            `-- ============ 阶段 1：建新表 + 拷数据 ============`,
            ``,
            `-- 1.1 按新结构创建空表（注意：这里只是"复制结构"，不复制数据）`,
            `-- CREATE TABLE \`${newT}\` LIKE \`${oldT}\`;`,
            `-- ↑ 如果新结构和旧结构完全一致，用 LIKE；否则手工写 CREATE TABLE`,
            ``,
            `-- 1.2 把旧表数据全量拷到新表`,
            `-- INSERT INTO \`${newT}\` SELECT * FROM \`${oldT}\`;`,
            ``,
            `-- 1.3 校验数据条数一致`,
            `-- SELECT COUNT(*) AS old_cnt FROM \`${oldT}\`;`,
            `-- SELECT COUNT(*) AS new_cnt FROM \`${newT}\`;`,
            ``,
            `-- ============ 阶段 2：应用层双写（手动）============`,
            ``,
            `-- 这一步需要在代码里做：`,
            `--   1) 所有写操作同时写 ${oldT} 和 ${newT}`,
            `--   2) 所有读操作优先读 ${newT}，兜底读 ${oldT}`,
            `--   3) 跑一段时间（建议至少一个完整业务周期）`,
            `--   4) 对比两边数据，确认完全一致`,
            ``,
            `-- ============ 阶段 3：清理 ============`,
            ``,
            `-- 3.1 把"旧表 → 新表"的外键切到新表`,
            `--     如果有外键指向 ${oldT}，需要先 DROP 然后重建指向 ${newT}`,
            ``,
            `-- 3.2 删除旧表`,
            `-- DROP TABLE \`${oldT}\`;`,
            ``,
            `-- 3.3 在 drizzle schema 里删除旧表的导出`,
            `--     src/db/schema/${oldT}.ts 整个文件删除`,
            ``,
        ]
        const out = `drizzle/manual_${ts()}_${oldT}_to_${newT}.sql`
        const fs = require('node:fs') as typeof import('node:fs')
        fs.writeFileSync(out, lines.join('\n'))
        console.log(`✅ 已生成双写迁移模板：${out}`)
        console.log()
        console.log('📌 接下来：')
        console.log('   1) 编辑该 SQL，把注释里的命令改成实际可执行的语句')
        console.log('   2) 阶段 1 执行后，跑 `pnpm db:sync:safe` 让 drizzle 接管 schema')
        console.log('   3) 阶段 2 应用层双写（代码改动）')
        console.log('   4) 阶段 3 手动 DROP 旧表')
        return
    }

    if (cmd.kind === 'rename-column') {
        const { table, old: oldC, new: newC } = cmd
        banner(`双写迁移：${table}.${oldC} → ${table}.${newC}`)
        console.log('列重命名比较特殊，MySQL 没有无损 RENAME COLUMN 的语义：')
        console.log()
        console.log('推荐流程：')
        console.log(`  1. ALTER TABLE \`${table}\` ADD COLUMN \`${newC}\` <type>;`)
        console.log(`  2. UPDATE \`${table}\` SET \`${newC}\` = \`${oldC}\`;`)
        console.log(`  3. 应用层切到读写 ${newC}（双写 ${oldC} 和 ${newC}）`)
        console.log(`  4. ALTER TABLE \`${table}\` DROP COLUMN \`${oldC}\`;`)
        console.log()
        console.log('如果一定要"瞬间改名"，可用：')
        console.log(`  ALTER TABLE \`${table}\` CHANGE \`${oldC}\` \`${newC}\` <type>;`)
        console.log('但这是 DDL 瞬间操作，应用层必须同步切换，否则会写错列。')
        return
    }
}

main()
