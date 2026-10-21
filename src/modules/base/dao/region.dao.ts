import { Injectable } from '@nestjs/common'
import { TransactionHost } from '@nestjs-cls/transactional'
import { BaseDb } from 'src/libs/dbhelper'
import { eq } from 'drizzle-orm'
import { baseProvinceTable } from 'src/db/schema/base-province'
import { baseCityTable } from 'src/db/schema/base-city'
import { baseAreaTable } from 'src/db/schema/base-area'
import { baseStreetTable } from 'src/db/schema/base-street'
import { baseCountryTable } from 'src/db/schema/base-country'
import { BaseArea, BaseCity, BaseCountry, BaseProvince, BaseStreet } from '../entities/region.entity'

@Injectable()
export class RegionDao extends BaseDb<typeof baseCountryTable> {
    protected readonly table = baseCountryTable
    protected readonly idColumn = baseCountryTable.id

    constructor(transactionHost: TransactionHost) {
        super(transactionHost)
    }

    /**
     * 获取所有国家
     */
    async findAllCountries(): Promise<BaseCountry[]> {
        return this.getDb().select().from(baseCountryTable)
    }

    /**
     * 根据国家ID获取省份列表
     * @param countryId 国家ID（暂时只支持中国）
     */
    async findProvincesByCountry(countryId: number): Promise<BaseProvince[]> {
        // 中国默认 ID 为 1（数据库中 alpha2_code = 'CN' 的记录）
        return this.getDb().select().from(baseProvinceTable).where(eq(baseProvinceTable.id, countryId))
    }

    /**
     * 获取所有省份（默认中国）
     */
    async findAllProvinces(): Promise<BaseProvince[]> {
        return this.getDb().select().from(baseProvinceTable)
    }

    /**
     * 根据省份ID获取城市列表
     * @param provinceId 省份数据库ID
     */
    async findCitiesByProvince(provinceId: number): Promise<BaseCity[]> {
        return this.getDb().select().from(baseCityTable).where(eq(baseCityTable.pid, provinceId))
    }

    /**
     * 根据城市ID获取区县列表
     * @param cityId 城市数据库ID
     */
    async findAreasByCity(cityId: number): Promise<BaseArea[]> {
        return this.getDb().select().from(baseAreaTable).where(eq(baseAreaTable.pid, cityId))
    }

    /**
     * 根据区县6位行政区划代码获取街道列表
     * @param areaId 区县数据库ID
     */
    async findStreetsByArea(areaId: number): Promise<BaseStreet[]> {
        // 先通过 areaId 获取 area_id（6位行政区划代码）
        const areas = await this.getDb().select().from(baseAreaTable).where(eq(baseAreaTable.id, areaId))

        if (!areas || areas.length === 0) {
            return []
        }

        const area = areas[0]
        // 使用 area_id（6位行政区划代码）查询街道
        return this.getDb()
            .select()
            .from(baseStreetTable)
            .where(eq(baseStreetTable.father, String(area.areaId).padStart(6, '0')))
    }

    /**
     * 直接通过区县6位行政区划代码获取街道列表
     * @param areaCode 区县6位行政区划代码
     */
    async findStreetsByAreaCode(areaCode: string): Promise<BaseStreet[]> {
        return this.getDb().select().from(baseStreetTable).where(eq(baseStreetTable.father, areaCode))
    }
}
