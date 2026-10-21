import { compileZodSchema, ZOD_SCHEMA_KEY } from '../decorators/zod.decorator'

/**
 * 给新类绑定 Schema
 */
function bindSchema(newClass: any, schema: any) {
    Reflect.defineMetadata(ZOD_SCHEMA_KEY, schema, newClass)
    return newClass
}

function toKeyRecord<K extends string | number | symbol>(keys: readonly K[]): Record<K, true> {
    return Object.fromEntries(keys.map(k => [k, true])) as Record<K, true>
}

/**
 * PartialType - 所有字段变为可选
 *
 * @example
 * class UpdateUserDto extends PartialType(CreateUserDto) {}
 */
export function PartialType<T extends new (...args: any[]) => any>(classRef: T): T {
    const schema = compileZodSchema(classRef)
    return bindSchema(class {}, schema.partial()) as T
}

/**
 * PickType - 仅保留指定字段
 *
 * @example
 * class UsernameDto extends PickType(CreateUserDto, ['username'] as const) {}
 */
export function PickType<T extends new (...args: any[]) => any, K extends keyof InstanceType<T>>(
    classRef: T,
    keys: readonly K[]
): new () => Pick<InstanceType<T>, K> {
    const schema = compileZodSchema(classRef).pick(toKeyRecord(keys as readonly string[]) as any)
    return bindSchema(class {}, schema) as any
}

/**
 * OmitType - 排除指定字段
 *
 * @example
 * class NoEmailDto extends OmitType(CreateUserDto, ['email'] as const) {}
 */
export function OmitType<T extends new (...args: any[]) => any, K extends keyof InstanceType<T>>(
    classRef: T,
    keys: readonly K[]
): new () => Omit<InstanceType<T>, K> {
    const schema = compileZodSchema(classRef).omit(toKeyRecord(keys as readonly string[]) as any)
    return bindSchema(class {}, schema) as any
}

/**
 * IntersectionType - 合并两个 DTO（深合并）
 *
 * @example
 * class CombinedDto extends IntersectionType(DtoA, DtoB) {}
 */
export function IntersectionType<A extends new (...args: any[]) => any, B extends new (...args: any[]) => any>(
    classRefA: A,
    classRefB: B
): new () => InstanceType<A> & InstanceType<B> {
    const schema = compileZodSchema(classRefA).merge(compileZodSchema(classRefB))
    return bindSchema(class {}, schema) as any
}
