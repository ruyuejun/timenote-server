import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { z, ZodError } from 'zod'
import { compileZodSchema, getTransformFunctions } from '../decorators/zod.decorator'

@Injectable()
export class ZodPipe implements PipeTransform {
    constructor(private schema?: z.ZodTypeAny) {}

    async transform(value: any, metadata: ArgumentMetadata) {
        const schema = this.resolveSchema(value, metadata)
        if (!schema) return value

        const transformed = this.applyTransforms(value, metadata)

        try {
            return await schema.parseAsync(transformed)
        } catch (error) {
            if (error instanceof ZodError) {
                throw new BadRequestException({
                    message: '请输入正确的参数',
                    errors: error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                })
            }
            throw error
        }
    }

    private resolveSchema(_value: any, metadata: ArgumentMetadata): z.ZodTypeAny | undefined {
        if (this.schema) return this.schema
        if (metadata.metatype) return compileZodSchema(metadata.metatype)
        return undefined
    }

    private applyTransforms(value: any, metadata: ArgumentMetadata): any {
        if (!metadata.metatype || this.schema) return value

        const transforms = getTransformFunctions(metadata.metatype)
        if (transforms.length === 0) return value

        let result = { ...value }
        for (const { propertyKey, transformer } of transforms) {
            if (propertyKey in result) {
                result[propertyKey] = transformer(result[propertyKey])
            }
        }
        return result
    }
}
