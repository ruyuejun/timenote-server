# @libs/zod2

一个基于 Zod 的 NestJS 参数校验库，提供类似 class-validator 的装饰器语法，同时支持导出 Schema 给前端使用。

## 核心理念

**所有校验都使用 Zod，装饰器只是语法糖。**

- ✅ 后端：使用装饰器写 DTO，体验类似 class-validator
- ✅ 前端：导出编译后的 Zod Schema，实现前后端校验规则共享
- ✅ 灵活：简单场景用装饰器，复杂场景直接写 Zod Schema
- ✅ 类型安全：完整的 TypeScript 类型推导

## 设计思想

### 为什么不用 class-validator？

1. **无法前后端共享**：class-validator 的装饰器元数据无法导出给前端
2. **复杂场景受限**：discriminatedUnion、transform 等高级功能难以实现
3. **类型推导弱**：需要手动维护类型定义

### 为什么选择 Zod？

1. **Schema First**：Schema 可以被序列化、传输、共享
2. **强大的类型推导**：`z.infer<typeof schema>` 自动生成类型
3. **功能完善**：支持各种复杂验证场景

### 本库的价值

通过装饰器语法糖，让 Zod 在 NestJS 中的使用体验**不输于** class-validator，同时保留 Zod 的所有优势。

## 快速开始

### 1. 安装依赖

```bash
pnpm add zod reflect-metadata
```

### 2. 定义 DTO（使用装饰器）

```typescript
import { IsString, MinLength, IsEmail, compileZodSchema } from '@/libs/zod2'

export class CreateUserDto {
    @IsString()
    @MinLength(3)
    username!: string

    @IsEmail()
    email!: string
}

// 编译为 Zod Schema，可导出给前端
export const CreateUserSchema = compileZodSchema(CreateUserDto)
```

### 3. 在控制器中使用

```typescript
import { ZodPipe } from '@/libs/zod2'

@Post('user')
createUser(@Body(new ZodPipe()) dto: CreateUserDto) {
    return { success: true, data: dto }
}
```

### 4. 前端使用（Schema 共享）

```typescript
// 前端导入 Schema
import { CreateUserSchema } from '@shared/dto'

// React Hook Form
const form = useForm({
    resolver: zodResolver(CreateUserSchema)
})

// 或者直接校验
const result = CreateUserSchema.safeParse(formData)
if (!result.success) {
    console.error(result.error)
}
```

## 装饰器 API

### 字符串

```typescript
@IsString(message?: string)              // 字符串类型
@MinLength(min: number, message?: string) // 最小长度
@MaxLength(max: number, message?: string) // 最大长度
@IsEmail(message?: string)               // 邮箱格式
```

### 数字

```typescript
@IsNumber(message?: string)              // 数字类型
@IsInt(message?: string)                 // 整数类型
@Min(min: number, message?: string)      // 最小值
@Max(max: number, message?: string)      // 最大值
```

### 通用

```typescript
@IsOptional()                            // 可选字段
@ValidateNested(DtoClass)                // 嵌套对象
@IsArray(DtoClass | ZodSchema)           // 数组
```

### 高级

```typescript
@ZodSchema(schema)                       // 直接绑定完整的 Zod Schema
```

## 完整示例

### 示例 1：简单 DTO

```typescript
import { IsString, MinLength, IsInt, Min, Max, compileZodSchema } from '@/libs/zod2'

export class CreateUserDto {
    @IsString('用户名必须是字符串')
    @MinLength(3, '用户名至少3个字符')
    username!: string

    @IsInt('年龄必须是整数')
    @Min(0, '年龄不能为负数')
    @Max(150, '年龄不能超过150')
    age!: number
}

// 导出 Schema
export const CreateUserSchema = compileZodSchema(CreateUserDto)
```

### 示例 2：嵌套对象

```typescript
export class AddressDto {
    @IsString()
    city!: string

    @IsString()
    street!: string

    @IsOptional()
    @IsString()
    zipCode?: string
}

export class UserProfileDto {
    @IsString()
    nickname!: string

    @ValidateNested(AddressDto)
    address!: AddressDto

    @IsOptional()
    @IsArray(AddressDto)
    otherAddresses?: AddressDto[]
}

export const UserProfileSchema = compileZodSchema(UserProfileDto)
```

### 示例 3：DTO 转换（PartialType、PickType、OmitType）

```typescript
import { PartialType, PickType, OmitType, compileZodSchema } from '@/libs/zod2'

// 所有字段变为可选
export class UpdateUserDto extends PartialType(CreateUserDto) {}

// 只选择指定字段
export class UsernameOnlyDto extends PickType(CreateUserDto, ['username'] as const) {}

// 排除指定字段
export class UserWithoutAgeDto extends OmitType(CreateUserDto, ['age'] as const) {}

// 导出
export const UpdateUserSchema = compileZodSchema(UpdateUserDto)
```

### 示例 4：复杂场景直接用 Zod

对于 discriminatedUnion、transform 等复杂场景，可以直接写 Zod Schema：

```typescript
import { z } from 'zod'
import { ZodPipe } from '@/libs/zod2'

export const SearchUserSchema = z.object({
    keyword: z.string().optional(),
    page: z.number().int().min(1).default(1),

    // 联合类型
    filter: z.discriminatedUnion('type', [
        z.object({ type: z.literal('name'), value: z.string() }),
        z.object({ type: z.literal('age'), value: z.number() }),
        z.object({ type: z.literal('email'), value: z.string().email() }),
    ]).optional(),
})

export type SearchUserQuery = z.infer<typeof SearchUserSchema>

// 控制器中使用
@Get('search')
search(@Query(new ZodPipe(SearchUserSchema)) query: SearchUserQuery) {
    return { success: true, data: query }
}
```

## 工作原理

### 装饰器 → Zod Schema 编译流程

```txt
1. 装饰器收集元数据
   @IsString() + @MinLength(3) → Metadata { username: [...] }

2. compileZodSchema() 编译
   Metadata → z.object({ username: z.string().min(3) })

3. ZodPipe 运行时校验
   value → schema.parseAsync(value) → validated data
```

### 关键设计

#### 1. 装饰器叠加机制

```typescript
@IsString()       // 创建 z.string()
@MinLength(3)     // 找到已有的 z.string()，叠加 .min(3)
@MaxLength(50)    // 继续叠加 .max(50)
username!: string // 最终：z.string().min(3).max(50)
```

#### 2. 两种 Schema 来源

```typescript
// 方式 1: 从装饰器编译
export class CreateUserDto {
    @IsString()
    username!: string
}
const schema = compileZodSchema(CreateUserDto) // z.object({...})

// 方式 2: 直接使用 Zod Schema
export const SearchSchema = z.object({
    keyword: z.string().optional()
})
```

#### 3. 统一的 ZodPipe

```typescript
@Post('user')
// 自动编译 DTO 类的 Schema
createUser(@Body(new ZodPipe()) dto: CreateUserDto) {}

@Get('search')
// 直接使用提供的 Schema
search(@Query(new ZodPipe(SearchSchema)) query: SearchQuery) {}
```

## 与 class-validator 对比

| 特性 | class-validator | @libs/zod2 |
| ------ | ----------------- | ------------ |
| 装饰器语法 | ✅ | ✅ |
| 前端共享 | ❌ 无法导出 | ✅ 导出 Zod Schema |
| 复杂场景 | 🟡 需自定义 | ✅ 直接用 Zod |
| 类型推导 | 🟡 需手动 | ✅ z.infer 自动推导 |
| 嵌套/数组 | ✅ | ✅ |
| PartialType 等 | ✅ | ✅ |
| 学习曲线 | 低 | 低（语法相同） |
| 生态 | 成熟 | 依赖 Zod 生态 |

## 错误响应格式

```json
{
  "message": "参数校验失败",
  "errors": [
    {
      "field": "username",
      "message": "用户名至少3个字符"
    },
    {
      "field": "age",
      "message": "年龄不能为负数"
    }
  ]
}
```

## 最佳实践

### 1. 优先使用装饰器

简单场景用装饰器，保持代码简洁：

```typescript
export class CreateUserDto {
    @IsString()
    @MinLength(3)
    username!: string
}
```

### 2. 复杂场景用 Zod

遇到 discriminatedUnion、transform 等，直接写 Zod Schema：

```typescript
export const ComplexSchema = z.object({
    data: z.discriminatedUnion('type', [...])
})
```

### 3. 始终导出 Schema

```typescript
// DTO 文件
export class CreateUserDto { ... }
export const CreateUserSchema = compileZodSchema(CreateUserDto)

// 统一导出文件 (dto/index.ts)
export { CreateUserDto, CreateUserSchema } from './create-user.dto'
```

### 4. 提供清晰的错误信息

```typescript
@IsString('用户名必须是字符串')  // 而不是默认的 "必须是字符串"
@MinLength(3, '用户名至少3个字符')
```

### 5. 嵌套 DTO 也要导出 Schema

```typescript
export class AddressDto { ... }
export const AddressSchema = compileZodSchema(AddressDto)

export class UserDto {
    @ValidateNested(AddressDto)
    address!: AddressDto
}
export const UserSchema = compileZodSchema(UserDto)
```

## 项目结构建议

```txt
src/
├── libs/
│   └── zod2/                    # 本库
│       ├── decorators/
│       ├── pipes/
│       ├── utils/
│       └── index.ts
├── modules/
│   └── user/
│       ├── dto/
│       │   ├── create-user.dto.ts
│       │   ├── update-user.dto.ts
│       │   └── index.ts         # 导出所有 DTO 和 Schema
│       └── user.controller.ts
└── shared/                       # 前后端共享
    └── schemas/                  # 可选：前端专用的 Schema 包
```

## FAQ

### Q1: 为什么不直接用 nestjs-zod？

A: nestjs-zod 强制使用 `createZodDto(schema)` 的方式，失去了装饰器的便利性。本库提供装饰器语法，同时保留 Zod 的灵活性。

### Q2: 装饰器和直接写 Zod Schema 有什么区别？

A:

- 装饰器：适合简单场景，写法类似 class-validator，对后端开发者友好
- 直接写 Schema：适合复杂场景，充分利用 Zod 的强大功能

两者可以混用，通过 `compileZodSchema()` 和 `ZodPipe` 统一处理。

### Q3: 如何处理 Query 参数的类型转换？

A: Zod 支持自动类型转换（coercion）：

```typescript
export const QuerySchema = z.object({
    page: z.coerce.number().int().min(1),  // "1" → 1
    limit: z.coerce.number().int().max(100),
})
```

### Q4: 前端如何使用导出的 Schema？

A: 通过 monorepo、npm 包或代码生成工具共享：

```typescript
// 方案 1: monorepo 直接引用
import { CreateUserSchema } from '@backend/dto'

// 方案 2: 发布 npm 包
import { CreateUserSchema } from '@company/shared-schemas'

// 方案 3: 代码生成
// 运行脚本把 Schema 导出到前端项目
```

## 总结

`@libs/zod2` 是一个**以 Zod 为核心**的 NestJS 参数校验库：

1. **后端友好**：装饰器语法，体验不输 class-validator
2. **前端共享**：导出 Zod Schema，实现前后端校验一致
3. **灵活强大**：简单用装饰器，复杂用 Zod，无缝切换
4. **类型安全**：完整的 TypeScript 支持

**一句话总结**：让 Zod 在 NestJS 中像 class-validator 一样好用，同时保留 Zod 的所有优势。
