import 'reflect-metadata'
import { z } from 'zod'

// ============ Metadata Keys ============
export const ZOD_SCHEMA_KEY = Symbol.for('zod:schema')
export const ZOD_FIELD_KEY = Symbol.for('zod:field')
export const ZOD_TRANSFORM_KEY = Symbol.for('zod:transform')

// ============ Types ============
interface FieldMetadata {
    propertyKey: string
    schema: z.ZodTypeAny
}

export type ZodDecoratorOptions = string | undefined

// ============ Schema Storage ============

/**
 * 给整个类显式绑定一个完整的 Zod Schema
 * 用法：@ZodSchema(MySchema)
 */
export function ZodSchema(schema: z.ZodTypeAny) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
        Reflect.defineMetadata(ZOD_SCHEMA_KEY, schema, constructor)
        return constructor
    }
}

/**
 * 读取已绑定的 Schema
 */
export function getZodSchema(target: any): z.ZodTypeAny | undefined {
    return Reflect.getMetadata(ZOD_SCHEMA_KEY, target)
}

// ============ Internal Helpers ============

function getFields(target: any): FieldMetadata[] {
    return Reflect.getMetadata(ZOD_FIELD_KEY, target) || []
}

function setFields(target: any, fields: FieldMetadata[]) {
    Reflect.defineMetadata(ZOD_FIELD_KEY, fields, target)
}

function findField(target: any, propertyKey: string): FieldMetadata | undefined {
    return getFields(target).find(f => f.propertyKey === propertyKey)
}

function appendField(target: any, field: FieldMetadata) {
    const fields = getFields(target)
    fields.push(field)
    setFields(target, fields)
}

/**
 * 基础装饰器工厂：查找现有字段并更新，或追加新字段
 * 如果字段已存在，不替换（因为修饰型装饰器可能已经应用了约束）
 */
function createFieldDecorator(schemaFactory: () => z.ZodTypeAny) {
    return function (target: any, propertyKey: string) {
        const existing = findField(target.constructor, propertyKey)

        if (!existing) {
            // 字段不存在，创建新字段
            appendField(target.constructor, { propertyKey, schema: schemaFactory() })
        }
        // 如果字段已存在，不做任何操作，保留现有 schema
    }
}

/**
 * 修饰型装饰器工厂：
    - 若字段已存在且 schema 类型兼容，则通过 transform 修改现有 schema
    - 否则追加一个新的 schema
 *
 * 用法：@Min(0) → 数字字段叠加最小值；不存在则创建 z.number().min(0)
 */
function createModifierDecorator<T extends z.ZodTypeAny>(
    match: (schema: z.ZodTypeAny) => schema is T,
    fallback: () => T,
    transform: (schema: T, ...args: any[]) => T
) {
    return function (...args: any[]) {
        // 用 overload 思路：直接根据函数签名判断是 decorator 还是工厂返回
        const decorator = (target: any, propertyKey: string) => {
            const existing = findField(target.constructor, propertyKey)
            if (existing && match(existing.schema)) {
                existing.schema = transform(existing.schema, ...args)
            } else {
                appendField(target.constructor, {
                    propertyKey,
                    schema: transform(fallback(), ...args),
                })
            }
        }
        return decorator
    }
}

// ============ Compiler ============

/**
 * 从装饰器元数据编译出 Zod Schema。
 * 优先使用 @ZodSchema，否则从字段装饰器编译。
 */
export function compileZodSchema(target: any): z.ZodObject<any> {
    const explicitSchema = getZodSchema(target)
    if (explicitSchema) {
        return explicitSchema as z.ZodObject<any>
    }

    const fields = getFields(target)
    const shape: Record<string, z.ZodTypeAny> = {}
    // 由于装饰器执行顺序从下到上，同一字段可能有多条记录
    // 需要取最后一条记录（即最后执行的装饰器设置的 schema）
    for (const field of fields) {
        shape[field.propertyKey] = field.schema
    }
    return z.object(shape)
}

// ============ String Decorators ============

export function IsString(message?: string) {
    return createFieldDecorator(() => z.string({ message: message || '必须是字符串' }))
}

export function IsDate(message?: string) {
    return createFieldDecorator(() => z.date({ message: message || '必须是日期' }))
}

export const MinLength = createModifierDecorator<z.ZodString>(
    (s): s is z.ZodString => s instanceof z.ZodString,
    () => z.string(),
    (schema, min: number, message?: string) => schema.min(min, message || `最小长度为 ${min}`)
)

export const MaxLength = createModifierDecorator<z.ZodString>(
    (s): s is z.ZodString => s instanceof z.ZodString,
    () => z.string(),
    (schema, max: number, message?: string) => schema.max(max, message || `最大长度为 ${max}`)
)

export const IsEmail = createModifierDecorator<z.ZodString>(
    (s): s is z.ZodString => s instanceof z.ZodString,
    () => z.string(),
    (schema, message?: string) => schema.email(message || '邮箱格式不正确')
)

export const IsPhone = createModifierDecorator<z.ZodString>(
    (s): s is z.ZodString => s instanceof z.ZodString,
    () => z.string(),
    (schema, message?: string) => schema.regex(/^1[3-9]\d{9}$/, message || '手机号格式不正确')
)

export const IsJson = createModifierDecorator<z.ZodString>(
    (s): s is z.ZodString => s instanceof z.ZodString,
    () => z.string(),
    (schema, message?: string) =>
        schema.refine(
            val => {
                try {
                    JSON.parse(val)
                    return true
                } catch {
                    return false
                }
            },
            { message: message || 'JSON 格式不正确' }
        )
)

export function IsNotEmpty(message = '不能为空') {
    return function (target: any, propertyKey: string) {
        const existing = findField(target.constructor, propertyKey)
        const schema = existing?.schema ?? z.unknown()

        const isNotEmpty = (value: unknown) => {
            if (value === undefined || value === null) return false
            if (typeof value === 'string') return value.trim().length > 0
            if (Array.isArray(value)) return value.length > 0
            return true
        }

        const refinedSchema = schema.refine(isNotEmpty, { message })
        if (existing) {
            existing.schema = refinedSchema
        } else {
            appendField(target.constructor, { propertyKey, schema: refinedSchema })
        }
    }
}

// ============ Number Decorators ============

export function IsNumber(message?: string) {
    return createFieldDecorator(() => z.number({ message: message || '必须是数字' }))
}

export function IsInt(message?: string) {
    return createFieldDecorator(() => z.number().int(message || '必须是整数'))
}

export const Min = createModifierDecorator<z.ZodNumber>(
    (s): s is z.ZodNumber => s instanceof z.ZodNumber,
    () => z.number(),
    (schema, min: number, message?: string) => schema.min(min, message || `最小值为 ${min}`)
)

export const Max = createModifierDecorator<z.ZodNumber>(
    (s): s is z.ZodNumber => s instanceof z.ZodNumber,
    () => z.number(),
    (schema, max: number, message?: string) => schema.max(max, message || `最大值为 ${max}`)
)

// ============ Optional ============

export function IsOptional() {
    return function (target: any, propertyKey: string) {
        const existing = findField(target.constructor, propertyKey)
        if (existing) {
            existing.schema = existing.schema.optional()
        } else {
            appendField(target.constructor, {
                propertyKey,
                schema: z.unknown().optional(),
            })
        }
    }
}

export function IsNullable() {
    return function (target: any, propertyKey: string) {
        const existing = findField(target.constructor, propertyKey)
        if (existing) {
            existing.schema = existing.schema.nullable()
        } else {
            appendField(target.constructor, {
                propertyKey,
                schema: z.unknown().nullable(),
            })
        }
    }
}

// ============ Nested & Array ============

/**
 * 嵌套 DTO：递归编译被嵌套类的 Schema
 */
export function ValidateNested(dtoClass: any) {
    return createFieldDecorator(() => compileZodSchema(dtoClass))
}

/**
 * 数组装饰器：
 * - IsArray() → z.array(z.unknown())
 * - IsArray(SomeDtoClass) → z.array(compileZodSchema(SomeDtoClass))
 * - IsArray(SomeZodSchema) → z.array(SomeZodSchema)
 */
export function IsArray(item?: (new (...args: any[]) => any) | z.ZodTypeAny) {
    return createFieldDecorator(() => {
        if (!item) return z.array(z.unknown())
        if (typeof item === 'function') return z.array(compileZodSchema(item))
        return z.array(item)
    })
}

// ============ Transform ============

interface TransformMetadata {
    propertyKey: string
    transformer: (value: any) => any
}

function getTransforms(target: any): TransformMetadata[] {
    return Reflect.getMetadata(ZOD_TRANSFORM_KEY, target) || []
}

function setTransforms(target: any, transforms: TransformMetadata[]) {
    Reflect.defineMetadata(ZOD_TRANSFORM_KEY, transforms, target)
}

/**
 * 将值从一种类型转换为另一种类型。
 *
 * @example
 * ```ts
 * export class CreateUserDto {
 *     @IsOptional()
 *     @Transform(val => Number(val))  // 字符串转数字
 *     @IsInt()
 *     page?: number
 * }
 * ```
 */
export function Transform(transformer: (value: any) => any) {
    return function (target: any, propertyKey: string) {
        const transforms = getTransforms(target.constructor)
        transforms.push({ propertyKey, transformer })
        setTransforms(target.constructor, transforms)
    }
}

/**
 * 读取类的转换函数列表
 */
export function getTransformFunctions(target: any): TransformMetadata[] {
    return getTransforms(target)
}

/**
 * 将值转换为数字（字符串 query 参数转数字的简写）
 *
 * @example
 * ```ts
 * export class CreateUserDto {
 *     @IsOptional()
 *     @Type2Number()
 *     @IsInt()
 *     page?: number
 * }
 * ```
 */
export function Type2Number() {
    return Transform((val: any) => Number(val))
}

export function Type2Date(message?: string) {
    return createFieldDecorator(() =>
        z
            .string()
            .transform(val => new Date(val))
            .pipe(z.date({ message: message || '日期格式不正确' }))
    )
}
