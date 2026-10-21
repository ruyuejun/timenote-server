import 'reflect-metadata'

// 存储被排除的字段元数据
export const EXCLUDED_FIELDS_KEY = 'exclude_fields'

// 全局注册表：类构造函数 -> 被 @Exclude 标记的字段列表
const EXCLUDED_FIELDS_REGISTRY = new WeakMap<object, string[]>()

// 已注册类列表（用于遍历）
const REGISTERED_CLASSES: object[] = []

/**
 * 标记字段在响应时被排除
 */
export function Exclude(): PropertyDecorator {
    return (target, propertyKey) => {
        const ctor = target.constructor as object

        // 写入原型元数据
        const metadata: Record<string, boolean> = Reflect.getOwnMetadata(EXCLUDED_FIELDS_KEY, target) || {}
        metadata[String(propertyKey)] = true
        Reflect.defineMetadata(EXCLUDED_FIELDS_KEY, metadata, target)

        // 维护全局注册表
        const fieldName = String(propertyKey)
        const list = EXCLUDED_FIELDS_REGISTRY.get(ctor) || []
        if (!list.includes(fieldName)) {
            list.push(fieldName)
            EXCLUDED_FIELDS_REGISTRY.set(ctor, list)
        }

        // 维护已注册类列表
        if (!REGISTERED_CLASSES.includes(ctor)) {
            REGISTERED_CLASSES.push(ctor)
        }
    }
}

/**
 * 手动注册一个类的 @Exclude 字段
 *
 * 用途：在 entity 文件中显式调用，绕过 SWC 优化
 */
export function ExcludeRegistry(ctor: new () => object, fields: string[]): void {
    EXCLUDED_FIELDS_REGISTRY.set(ctor, fields)
    if (!REGISTERED_CLASSES.includes(ctor)) {
        REGISTERED_CLASSES.push(ctor)
    }
}

/**
 * 获取类中被标记为排除的字段
 */
export function getExcludedFields(target: object): string[] {
    const ctor = (target as { constructor?: object }).constructor
    if (ctor && ctor !== Object && ctor !== Function) {
        const registered = EXCLUDED_FIELDS_REGISTRY.get(ctor)
        if (registered) {
            return [...registered]
        }
    }

    // plain object 场景：完全字段匹配
    const matchedClass = findMatchingClass(target)
    if (matchedClass) {
        const excluded = EXCLUDED_FIELDS_REGISTRY.get(matchedClass)
        if (excluded) {
            return [...excluded]
        }
    }

    // 回退：遍历原型链读取元数据
    const fields: string[] = []
    let proto: object | null = target
    while (proto && proto !== Object.prototype && proto !== Function.prototype) {
        const metadata: Record<string, boolean> = Reflect.getOwnMetadata(EXCLUDED_FIELDS_KEY, proto) || {}
        Object.keys(metadata).forEach(key => {
            if (!fields.includes(key)) {
                fields.push(key)
            }
        })
        proto = Object.getPrototypeOf(proto)
    }

    return fields
}

/**
 * 通过字段名集合匹配找到对应的类
 * 必须是完全匹配（plain object 包含所有 @Exclude 字段）
 */
function findMatchingClass(target: object): object | null {
    let bestMatch: { ctor: object; score: number } | null = null

    for (const ctor of REGISTERED_CLASSES) {
        const excludedFields = EXCLUDED_FIELDS_REGISTRY.get(ctor)
        if (!excludedFields || excludedFields.length === 0) continue

        let matchCount = 0
        for (const field of excludedFields) {
            if (field in target) {
                matchCount++
            }
        }

        // 必须完全匹配
        if (matchCount === excludedFields.length) {
            if (!bestMatch || matchCount > bestMatch.score) {
                bestMatch = { ctor, score: matchCount }
            }
        }
    }

    return bestMatch?.ctor ?? null
}
