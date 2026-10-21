import { Injectable } from '@nestjs/common'
import { TransactionHost } from '@nestjs-cls/transactional'
import { BaseDb } from 'src/libs/dbhelper'
import { userTable } from 'src/db/schema/user'
import { and, eq, like, sql, type SQL } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { FindUserDto } from '../dto/find-user.dto'

type UserSelect = InferSelectModel<typeof userTable>

@Injectable()
export class UserDao extends BaseDb<typeof userTable> {
    protected readonly table = userTable
    protected readonly idColumn = userTable.id

    constructor(transactionHost: TransactionHost) {
        super(transactionHost)
    }

    async find(dto: FindUserDto) {
        const conditions: SQL[] = []

        if (dto.nickname) {
            conditions.push(like(userTable.nickname, `%${dto.nickname}%`))
        }

        if (dto.username) {
            conditions.push(eq(userTable.username, dto.username))
        }

        return this.findConditions(conditions, {
            page: dto.page,
            limit: dto.limit,
        })
    }

    async findWithRoles(dto: FindUserDto) {
        const conditions: SQL[] = []
        if (dto.nickname) conditions.push(sql`u.nickname LIKE ${`%${dto.nickname}%`}`)
        if (dto.username) conditions.push(sql`u.username = ${dto.username}`)

        const whereSql = conditions.length > 0 ? sql`AND ${and(...conditions)}` : sql``

        const results = await this.execute<Array<UserSelect & { roles: number[] }>>`
            SELECT
                u.*,
                COALESCE(
                    (SELECT JSON_ARRAYAGG(rid)
                     FROM (
                         SELECT ur.rid
                         FROM user_role ur
                         JOIN role r ON r.id = ur.rid
                         WHERE ur.uid = u.id AND r.id IS NOT NULL
                     ) AS valid_roles),
                    JSON_ARRAY()
                ) AS roles
            FROM user u
            WHERE u.is_del = 0
                ${whereSql}
        `

        return results.map(user => ({
            ...user,
            roles: Array.isArray(user.roles) ? (user.roles as number[]) : [],
        }))
    }

    async findPageWithRoles(page: number, limit: number) {
        const safePage = Math.max(1, Math.floor(page))
        const safeLimit = Math.max(1, Math.floor(limit))
        const offset = (safePage - 1) * safeLimit

        const results = await this.execute<Array<UserSelect & { roles: number[] }>>`
            SELECT
                u.*,
                COALESCE(
                    (SELECT JSON_ARRAYAGG(rid)
                     FROM (
                         SELECT ur.rid
                         FROM user_role ur
                         JOIN role r ON r.id = ur.rid
                         WHERE ur.uid = u.id AND r.id IS NOT NULL
                     ) AS valid_roles),
                    JSON_ARRAY()
                ) AS roles
            FROM user u
            WHERE u.is_del = 0
            GROUP BY u.id
            LIMIT ${safeLimit}
            OFFSET ${offset}
        `

        return results.map(user => ({
            ...user,
            roles: Array.isArray(user.roles) ? (user.roles as number[]) : [],
        }))
    }

    async findByIdWithRoles(id: number) {
        const results = await this.execute<Array<UserSelect & { roles: number[] }>>`
            SELECT
                u.*,
                COALESCE(
                    (SELECT JSON_ARRAYAGG(rid)
                     FROM (
                         SELECT ur.rid
                         FROM user_role ur
                         JOIN role r ON r.id = ur.rid
                         WHERE ur.uid = u.id AND r.id IS NOT NULL
                     ) AS valid_roles),
                    JSON_ARRAY()
                ) AS roles
            FROM user u
            WHERE u.id = ${id}
              AND u.is_del = 0
        `

        if (!results || results.length === 0) {
            return []
        }

        const user = results[0]
        return [
            {
                ...user,
                roles: Array.isArray(user.roles) ? (user.roles as number[]) : [],
            },
        ]
    }

    async countWithRoles(dto: FindUserDto) {
        const conditions: SQL[] = []
        if (dto.nickname) conditions.push(sql`u.nickname LIKE ${`%${dto.nickname}%`}`)
        if (dto.username) conditions.push(sql`u.username = ${dto.username}`)

        const whereSql = conditions.length > 0 ? sql`AND ${and(...conditions)}` : sql``

        const result = await this.execute<[{ value: number }]>`
            SELECT COUNT(DISTINCT u.id) AS value
            FROM user u
            LEFT JOIN user_role ur ON u.id = ur.uid
            LEFT JOIN role r ON ur.rid = r.id
            WHERE u.is_del = 0
            ${whereSql}
        `

        return Number(result[0]?.value ?? 0)
    }
}
