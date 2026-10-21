# DBHelper 数据库工具库

基于 `@nestjs-cls/transactional` + Drizzle ORM 的数据库操作封装。

## 目录

- [快速开始](#快速开始)
- [事务管理](#事务管理)
- [完整示例](#完整示例)

## 快速开始

### 模块配置

`AppModule` 中已配置 `ClsModule` 和 `DrizzleModule`：

```typescript
import { Module } from '@nestjs/common'
import { ClsModule } from 'nestjs-cls'
import { ClsPluginTransactional } from '@nestjs-cls/transactional'
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm'
import { DrizzleModule, DRIZZLE } from './db/drizzle.module'

@Module({
    imports: [
        ClsModule.forRoot({
            global: true,
            middleware: {
                mount: true,
            },
            plugins: [
                new ClsPluginTransactional({
                    imports: [DrizzleModule],
                    adapter: new TransactionalAdapterDrizzleOrm({
                        drizzleInstanceToken: DRIZZLE,
                    }),
                }),
            ],
        }),
        DrizzleModule,
        // ... other modules
    ],
})
export class AppModule {}
```

### 创建 DAO

```typescript
import { Injectable } from '@nestjs/common'
import { TransactionHost } from '@nestjs-cls/transactional'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import { BaseDb } from 'src/libs/dbhelper'
import { userTable } from 'src/db/schema/users'

@Injectable()
export class UserDao extends BaseDb<typeof userTable> {
    protected readonly table = userTable
    protected readonly idColumn = userTable.id

    constructor(private readonly transactionHost: TransactionHost) {
        super()
    }

    protected getDb(): MySql2Database {
        return this.transactionHost.tx as MySql2Database
    }
}
```

### BaseDb 提供的 CRUD 方法

| 方法 | 说明 |
| ------ | ------ |
| `create(data)` | 插入数据，返回插入的 ID |
| `update(id, data)` | 更新数据（软删除） |
| `change(id, data)` | 物理更新数据 |
| `delete(id)` | 软删除（设置 is_del=true） |
| `findById(id)` | 根据 ID 查询单条 |
| `findAll()` | 查询所有 |
| `findPage(page, limit)` | 分页查询 |
| `findConditions(conditions, options)` | 条件分页查询 |
| `findConditions` | 支持 excludeFields 排除字段 |

## 事务管理

使用 `@Transactional()` 装饰器进行声明式事务管理。

### 方法级别事务

```typescript
import { Injectable } from '@nestjs/common'
import { Transactional } from '@nestjs-cls/transactional'
import { UserDao } from './dao/user.dao'
import { AccountDao } from './dao/account.dao'

@Injectable()
export class TransferService {
    constructor(
        private readonly userDao: UserDao,
        private readonly accountDao: AccountDao,
    ) {}

    @Transactional()
    async transfer(fromId: number, toId: number, amount: number) {
        const fromUser = await this.userDao.findById(fromId)
        if (!fromUser || fromUser.balance < amount) {
            throw new Error('余额不足')
        }

        await this.userDao.change(fromId, {
            balance: fromUser.balance - amount,
        })

        const toUser = await this.userDao.findById(toId)
        await this.userDao.change(toId, {
            balance: (toUser?.balance || 0) + amount,
        })
        // 自动提交或回滚
    }
}
```

### 类级别事务

```typescript
import { Injectable } from '@nestjs/common'
import { Transactional } from '@nestjs-cls/transactional'

@Injectable()
@Transactional()  // 所有方法都自动带事务
export class OrderService {
    // ...
}
```

### 嵌套事务

`@nestjs-cls/transactional` 自动处理嵌套事务。如果已经在事务中，嵌套调用会复用同一个事务。

## 完整示例

### 电商下单场景

```typescript
@Injectable()
export class OrderService extends BaseSqlService {
    constructor(
        private readonly orderDao: OrderDao,
        private readonly productDao: ProductDao,
        private readonly userDao: UserDao,
    ) {
        super()
    }

    @Transactional()
    async placeOrder(userId: number, items: OrderItem[]) {
        // 1. 检查用户余额
        const user = await this.userDao.findById(userId)
        if (!user) {
            throw new Error('用户不存在')
        }

        const totalAmount = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        )

        if (user.balance < totalAmount) {
            throw new Error('余额不足')
        }

        // 2. 检查库存并扣减
        for (const item of items) {
            const product = await this.productDao.findById(item.productId)
            if (!product || product.stock < item.quantity) {
                throw new Error(`商品 ${item.productId} 库存不足`)
            }

            await this.productDao.change(item.productId, {
                stock: product.stock - item.quantity,
            })
        }

        // 3. 扣减余额
        await this.userDao.change(userId, {
            balance: user.balance - totalAmount,
        })

        // 4. 创建订单
        const [order] = await this.orderDao.create({
            user_id: userId,
            total_amount: totalAmount,
            status: 'pending',
        })

        // 任何一步失败，所有操作都会自动回滚
        return { orderId: order.id, totalAmount }
    }
}
```

## 示例

```typescript
@Transactional()
async transfer(fromId: number, toId: number, amount: number) {
    const fromUser = await this.userDao.findById(fromId)
    await this.userDao.change(fromId, {
        balance: fromUser.balance - amount,
    })
    await this.userDao.change(toId, {
        balance: fromUser.balance + amount,
    })
}
```

## 注意事项

### 类型安全

使用 `excludeFields` 排除敏感字段：

```typescript
async findUser(id: number) {
    // 排除密码字段
    return this.userDao.findById(id, ['password'])
}
```
