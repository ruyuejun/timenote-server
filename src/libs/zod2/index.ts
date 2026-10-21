/**
 * @zod2/lib
 *
 * 一套基于 Zod 的 NestJS 参数校验库。
 *
 * 核心理念：
 * 1. Schema 是一等公民：可以由装饰器编译得到，也可以直接手写 Zod Schema
 * 2. Schema 可被前后端共享，导出给前端做表单/接口校验
 * 3. 统一通过 ZodPipe 完成运行时校验
 *
 * @example
 * ```ts
 * // 1. 装饰器方式定义 DTO
 * export class CreateUserDto {
 *     @IsString()
 *     @MinLength(3)
 *     username!: string
 *
 *     @IsEmail()
 *     email!: string
 * }
 *
 * // 2. 编译为可导出的 Schema
 * export const CreateUserSchema = compileZodSchema(CreateUserDto)
 *
 * // 3. 在控制器中使用
 * @Post('user')
 * createUser(@Body(new ZodPipe()) dto: CreateUserDto) {}
 * ```
 */

// ========== Decorators ==========
export {
    // String
    IsString,
    MinLength,
    MaxLength,
    IsEmail,
    IsPhone,
    IsJson,
    IsNotEmpty,
    // Date
    IsDate,
    // Number
    IsNumber,
    IsInt,
    Min,
    Max,
    // General
    IsOptional,
    IsNullable,
    ValidateNested,
    IsArray,
    // Schema binding
    ZodSchema,
    getZodSchema,
    compileZodSchema,
    // Transform
    Transform,
    Type2Number,
    Type2Date,
    getTransformFunctions,
} from './decorators/zod.decorator'

// ========== Pipe ==========
export { ZodPipe } from './pipes/zod.pipe'

// ========== DTO Helpers ==========
export { PartialType, PickType, OmitType, IntersectionType } from './utils/dto-helpers'
