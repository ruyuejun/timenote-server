import { z } from 'zod'

const DEV_JWT_SECRET_FALLBACK = 'development-jwt-secret-change-me'

export const envSchema = z
    .object({
        NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
        PORT: z.coerce.number().int().positive().max(65535).default(3000),
        API_PREFIX: z.string().min(1).default('api/v1'),
        DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
        LOG_DIR: z.string().min(1).default('logs'),
        UPLOAD_DIR: z.string().min(1).default('uploads'),
        JWT_SECRET: z.string().min(1),
        JWT_EXPIRES_IN: z.string().min(1).default('7d'),
    })
    .superRefine((data, ctx) => {
        if (data.NODE_ENV === 'production' && data.JWT_SECRET === DEV_JWT_SECRET_FALLBACK) {
            ctx.addIssue({
                code: 'custom',
                path: ['JWT_SECRET'],
                message: 'JWT_SECRET must be explicitly configured in production',
            })
        }
    })

export type EnvSchema = z.infer<typeof envSchema>
