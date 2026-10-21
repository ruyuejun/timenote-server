# README

## TypeScript Version

You need to open the vscode command: `TypeScript: Select TypeScript Version`, then choose the typescript version mathed the package.json.

## 数据库同步（推荐流程）

```bash
pnpm db:check            # 预检：schema 中声明的表 vs 数据库实际表
pnpm db:sync:safe        # generate → 扫描破坏性操作 → migrate（推荐日常用）
pnpm db:sync             # 直接 generate + migrate（不带安全检查，老脚本保留）
pnpm db:rename <old> <new>             # 双写迁移：把旧表无损重命名为新表
pnpm db:rename --column <t> <old> <new> # 双写迁移：字段重命名
```

### db:check

读取 `src/db/schema/*.ts` 里的 `mysqlTable('xxx', ...)` / `createTable('xxx', ...)`，对比数据库实际表：

- schema 有但库没有 → 新增（安全）
- 库有但 schema 没有 → 消失（破坏性，会被 DROP）
- **改名**（表名变化）→ Drizzle 会 DROP 旧表 + CREATE 新表，**数据丢失**

### db:sync:safe

三层护栏：
1. `drizzle-kit generate` 生成迁移 SQL
2. 扫描所有 `drizzle/<timestamp>_*/migration.sql`，匹配以下正则即拒绝执行：
   - `DROP TABLE` / `TRUNCATE TABLE`
   - `ALTER TABLE ... DROP [COLUMN]`
3. 检查通过 → `drizzle-kit migrate`

强制执行破坏性操作：`pnpm db:sync:safe --force`（请先备份数据）。

### db:rename

无损重命名表 / 字段。会生成一个 `drizzle/manual_<ts>_<old>_to_<new>.sql` 模板，包含三阶段：

- **阶段 1**：`CREATE TABLE new LIKE old` + `INSERT INTO new SELECT * FROM old`
- **阶段 2**：应用层双写（一段时间）
- **阶段 3**：DROP 旧表

字段重命名走 `ADD COLUMN` + `UPDATE` + 应用层切换 + `DROP COLUMN`，或 `ALTER TABLE ... CHANGE`（瞬间）。

## Mysql

如果mysql 的参数为undefined、无字段两种情况则设计为自动过滤，不会进入 mysql；
如果参数为 null，则认为是有意义值，会进入 mysql。

## 响应序列化（SerializeInterceptor）

项目通过 `src/common/interceptors/serialize.interceptor.ts` 对所有 HTTP 响应做统一处理，包括：

1. **自动附加 `timestamp`**：在每个标准响应体（包含 `code` / `msg` / `data`）上添加服务端响应时间。
2. **自动格式化时间戳字段**：递归地把响应中名为 `add_time` / `upd_time` 的 `Date`（或可解析为日期的字符串/数字）转换为 `YYYY-MM-DD HH:mm:ss` 格式。
3. **自动过滤 `@Exclude` 字段**：递归移除被 `src/common/decorators/exclude.decorator.ts` 中 `@Exclude()` 装饰器标记的字段。

### 关键约定

- **Service 层不应再手动调用 `formatTimestamps`**：时间戳格式化由拦截器统一处理，Service 直接返回 `R.success(...)` 即可。
- **Service 不再需要继承 `BaseSqlService`**：原 `BaseSqlService.formatTimestamps()` 已被拦截器取代，类已删除。
- **内部 service 之间的调用**（如 `AuthService -> UserService`）**不会**经过拦截器，因此可以安全地基于原始 `Date` 字段或未脱敏字段做业务判断。响应给客户端前的格式化与脱敏由拦截器兜底。

## 数据库表设计（src/db/schema）

所有表通过 `createTable()` 创建，自动追加公共字段：`is_del`、`add_time`、`upd_time`、`add_user`、`del_user`。
业务表主键统一为自增 `int` id。

### 表清单

| 表名 | 文件 | 用途 |
| --- | --- | --- |
| `user` | `user.ts` | 用户账号（openid、username、tel、email、avatar、gender、birth …） |
| `role` | `role.ts` | 角色 |
| `user_role` | `user-role.ts` | 用户-角色关联表 |
| `doc` | `doc.ts` | 文档/目录 |
| `doc_history` | `doc-history.ts` | 文档历史版本 |
| `org` | `org.ts` | 组织（公司/企业） |
| `org_structure` | `org-structure.ts` | 组织架构（部门，树形结构，pid 自引用） |
| `org_member` | `org-member.ts` | 组织成员（员工） |
| `base_countries` | `base-countries.ts` | 国家/地区（ISO 3166-1，基础数据，无公共字段） |
| `base_province` | `base-province.ts` | 省份（基础数据，无公共字段） |
| `base_city` | `base-city.ts` | 城市（基础数据，无公共字段） |
| `base_area` | `base-area.ts` | 区县（基础数据，无公共字段） |
| `base_street` | `base-street.ts` | 乡镇/街道（基础数据，无公共字段） |

### org（组织表）

存储组织（公司/企业）基础信息。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | int PK | auto | 主键 |
| `name` | varchar(255) | `''` | 组织名称 |
| `short_name` | varchar(255) | `''` | 组织简称 |
| `code` | varchar(255) | `''` | 组织编码 / 统一社会信用代码 |
| `logo` | varchar(255) | `''` | 组织 logo |
| `tel` | varchar(255) | `''` | 联系电话 |
| `email` | varchar(255) | `''` | 联系邮箱 |
| `address` | varchar(255) | `''` | 组织地址 |
| `status` | tinyint | `1` | 状态：1 启用 0 停用 |

**条件唯一索引**：`code`（非空时全局唯一）。

### org_structure（组织架构表）

支持树形结构，通过 `pid` 自引用，`pid = 0` 表示顶级架构节点。
通过 `oid` 关联组织，删除组织时级联删除其下架构节点。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | int PK | auto | 主键 |
| `oid` | int FK→`org.id` | `0` | 所属组织 id，级联删除 |
| `pid` | int | `0` | 父节点 id，`0` 表示顶级 |
| `name` | varchar(255) | `''` | 节点名称（如：技术部 / 前端组） |
| `code` | varchar(255) | `''` | 节点编码 |
| `leader` | varchar(255) | `''` | 负责人姓名 |

### org_member（组织成员表）

通过 `oid` 关联组织，通过 `sid` 关联组织架构节点；成员离职/转岗时 `sid` 可置 `0`（`set default`）。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | int PK | auto | 主键 |
| `oid` | int FK→`org.id` | `0` | 所属组织 id，级联删除 |
| `sid` | int FK→`org_structure.id` | `0` | 所属架构节点 id，`0` 表示未分配；节点删除时回退默认 |
| `code` | varchar(255) | `''` | 成员工号/编号 |
| `name` | varchar(255) | `''` | 成员姓名 |
| `tel` | varchar(255) | `''` | 手机号 |
| `email` | varchar(255) | `''` | 邮箱 |
| `avatar` | varchar(255) | `''` | 头像 |
| `gender` | tinyint | `0` | 性别：0 未知 1 男 2 女 |
| `position` | varchar(255) | `''` | 职位 |
| `status` | tinyint | `1` | 状态：1 在职 0 离职 |

**条件唯一索引**：`code`（工号）、`tel`（手机号）均为非空时全局唯一。

### 关联关系一览

```
org (1) ──< org_structure (树形，pid 自引用)
org (1) ──< org_member
org_structure (1) ──< org_member
```

### 条件唯一索引说明

利用 MySQL 唯一索引自动忽略 NULL 的特性，通过 `CASE WHEN … = '' OR … IS NULL THEN NULL ELSE … END` 实现：

- 空字符串 / NULL → CASE 返回 NULL → 不参与唯一约束 → 可重复
- 非空值 → CASE 返回原值 → 唯一约束生效 → 必须唯一

参考实现见 `user.ts` 中的 `userConditionalIndexes`。

### base_countries（国家/地区表）

基础数据表，直接使用 `mysqlTable` 而非 `createTable`，无 `is_del/add_time/upd_time/add_user/del_user` 公共字段。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | int unsigned PK | auto | 主键 |
| `alpha2_code` | char(2) | — | ISO 3166-1 二位字母代码（唯一） |
| `alpha3_code` | char(3) | — | ISO 3166-1 三位字母代码（唯一） |
| `numeric_code` | char(3) | — | ISO 3166-1 三位数字代码（唯一） |
| `country_name` | varchar(100) | — | 国家/地区全称 |
| `country_short_name` | varchar(50) | — | 国家/地区简称 |
| `country_english_name` | varchar(100) | — | 国家/地区英文名称 |

**索引**：`alpha2_code` / `alpha3_code` / `numeric_code` 唯一索引；`country_name` / `country_english_name` 普通索引。

### base_province（省份表）

基础数据表，无公共字段。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | int PK | auto | 主键 |
| `province_id` | int | — | 行政区划业务 id（前 2 位编码，唯一） |
| `province_name` | varchar(40) | — | 省份名称 |
| `wm` | varchar(10) | `''` | 首字母/五笔简码 |

### base_city（城市表）

基础数据表，无公共字段。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | int PK | auto | 主键 |
| `city_id` | int | — | 行政区划业务 id（前 4 位编码，唯一） |
| `city_name` | varchar(50) | — | 城市名称 |
| `pid` | int | `0` | 父级 province.id，0 表示顶级 |

### base_area（区/县表）

基础数据表，无公共字段。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | int PK | auto | 主键 |
| `area_id` | int | — | 行政区划业务 id（6 位编码，唯一） |
| `area_name` | varchar(50) | — | 区县名称 |
| `pid` | int | `0` | 父级 city.id，0 表示顶级 |

### base_street（乡镇/街道表）

基础数据表，无公共字段、无外键。注意 father 是 varchar(6) 存储 6 位行政区划代码，与 `base_area.id`(int) 类型不同，不做 FK 约束。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | int PK | auto | 主键 |
| `street_name` | varchar(60) | `''` | 街道/乡镇名称 |
| `father` | varchar(6) | `''` | 父级区县 6 位行政区划代码 |
| `street_id` | varchar(50) | `''` | 街道/乡镇 9 位行政区划代码 |

**关联关系（逻辑层面，不加 FK）**：
```
base_province (1) ──< base_city (1) ──< base_area (1) ──< base_street
```

## 行政区划 API（BaseModule）

BaseModule 提供行政区划查询接口，支持获取国家、省份、城市、区县、街道等数据。

### 接口列表

| 接口 | 方法 | 参数 | 说明 |
| --- | --- | --- | --- |
| `/base/countries` | GET | 无 | 获取所有国家列表 |
| `/base/provinces` | GET | 可选 `countryId` | 获取省份列表（默认中国） |
| `/base/cities` | GET | `provinceId` | 获取某省份下的城市列表 |
| `/base/areas` | GET | `cityId` | 获取某城市下的区县列表 |
| `/base/streets` | GET | `areaId` | 获取某区县下的街道列表 |

### 使用示例

```bash
# 获取所有国家
curl http://localhost:3000/base/countries

# 获取省份列表（默认中国）
curl http://localhost:3000/base/provinces

# 获取某省份下的城市列表（provinceId 为省份的数据库 ID）
curl http://localhost:3000/base/cities?provinceId=1

# 获取某城市下的区县列表（cityId 为城市的数据库 ID）
curl http://localhost:3000/base/areas?cityId=1

# 获取某区县下的街道列表（areaId 为区县的数据库 ID）
curl http://localhost:3000/base/streets?areaId=1
```

### 响应格式

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "provinceId": 110000,
      "provinceName": "北京市",
      "wm": "BJS"
    }
  ],
  "timestamp": "2026-09-03 13:25:00"
}
```

### 层级关系

行政区划数据遵循以下层级关系：

```
国家 (countries)
  └── 省份 (provinces) - 通过 base_province.id 关联
        └── 城市 (cities) - 通过 base_city.pid 关联省份
              └── 区县 (areas) - 通过 base_area.pid 关联城市
                    └── 街道 (streets) - 通过 base_street.father 关联区县的6位行政区划代码
```

## 组织管理 API（OrgModule）

OrgModule 提供组织（公司/企业）、组织架构（部门）、组织成员（员工）的完整 CRUD 接口，统一挂载在 `/org` 前缀下。

### 组织接口

| 接口 | 方法 | 参数 | 说明 |
| --- | --- | --- | --- |
| `/org` | POST | `CreateOrgDto` | 创建组织 |
| `/org` | GET | 无 | 查询所有组织 |
| `/org/page` | GET | `page`, `limit` | 分页查询组织 |
| `/org/:id` | GET | `id` | 查询组织详情 |
| `/org/:id` | PATCH | `id`, `UpdateOrgDto` | 更新组织 |
| `/org/:id` | DELETE | `id` | 删除组织（软删除） |

### 组织架构接口

| 接口 | 方法 | 参数 | 说明 |
| --- | --- | --- | --- |
| `/org/structure` | POST | `CreateStructureDto` | 创建组织架构节点 |
| `/org/structure` | GET | 无 | 查询所有组织架构节点 |
| `/org/structure/page` | GET | `page`, `limit` | 分页查询 |
| `/org/structure/tree` | GET | `oid` | 按组织ID查询，返回树形结构 |
| `/org/structure/:id` | GET | `id` | 查询节点详情 |
| `/org/structure/:id` | PATCH | `id`, `UpdateStructureDto` | 更新节点 |
| `/org/structure/:id` | DELETE | `id` | 删除节点（软删除，存在子节点时拒绝） |

### 组织成员接口

| 接口 | 方法 | 参数 | 说明 |
| --- | --- | --- | --- |
| `/org/member` | POST | `CreateMemberDto` | 创建组织成员 |
| `/org/member` | GET | 无 | 查询所有成员 |
| `/org/member/page` | GET | `page`, `limit` | 分页查询 |
| `/org/member/list` | GET | `oid` | 按组织ID查询所有成员 |
| `/org/member/active` | GET | `oid` | 按组织ID查询在职成员 |
| `/org/member/structure/:sid` | GET | `sid` | 按架构节点查询成员 |
| `/org/member/tel/:tel` | GET | `tel` | 按手机号查询成员 |
| `/org/member/:id` | GET | `id` | 查询成员详情 |
| `/org/member/:id` | PATCH | `id`, `UpdateMemberDto` | 更新成员 |
| `/org/member/:id` | DELETE | `id` | 删除成员（软删除） |

### DTO 字段说明

**组织 DTO**：`CreateOrgDto` / `UpdateOrgDto`
- `name`（必填）：组织名称
- `shortName`（可选）：组织简称
- `code`（可选）：组织编码/统一社会信用代码（非空时全局唯一）
- `logo` / `tel` / `email` / `address`（可选）：联系信息
- `status`（可选）：1 启用 / 0 停用

**组织架构 DTO**：`CreateStructureDto` / `UpdateStructureDto`
- `oid`（创建时必填）：所属组织ID
- `pid`（可选）：父节点ID，0 表示顶级节点
- `name`（必填）：节点名称（如：技术部 / 前端组）
- `code`（可选）：节点编码
- `leader`（可选）：负责人姓名

**组织成员 DTO**：`CreateMemberDto` / `UpdateMemberDto`
- `oid`（创建时必填）：所属组织ID
- `sid`（可选）：所属架构节点ID，0 表示未分配
- `code`（可选）：成员工号（非空时全局唯一）
- `name`（创建时必填）：成员姓名
- `tel`（可选）：手机号（非空时全局唯一）
- `email` / `avatar`（可选）：联系信息
- `gender`（可选）：0 未知 / 1 男 / 2 女
- `position`（可选）：职位
- `status`（可选）：1 在职 / 0 离职

### 使用示例

```bash
# 创建组织
curl -X POST http://localhost:3000/org \
  -H "Content-Type: application/json" \
  -d '{"name": "示例公司", "code": "91110000XXXXXXXXXX", "status": 1}'

# 创建组织架构节点
curl -X POST http://localhost:3000/org/structure \
  -H "Content-Type: application/json" \
  -d '{"oid": 1, "pid": 0, "name": "技术部", "leader": "张三"}'

# 按组织查询树形架构
curl 'http://localhost:3000/org/structure/tree?oid=1'

# 创建组织成员
curl -X POST http://localhost:3000/org/member \
  -H "Content-Type: application/json" \
  -d '{"oid": 1, "name": "李四", "code": "EMP001", "tel": "13800138000", "gender": 1}'

# 按组织查询在职成员
curl 'http://localhost:3000/org/member/active?oid=1'

# 更新成员（如转岗）
curl -X PATCH http://localhost:3000/org/member/1 \
  -H "Content-Type: application/json" \
  -d '{"sid": 2, "position": "高级工程师"}'
```
