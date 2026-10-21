import { BaseAreaSchema } from 'src/db/schema/base-area'
import { BaseCitySchema } from 'src/db/schema/base-city'
import { BaseCountrySchema } from 'src/db/schema/base-country'
import { BaseProvinceSchema } from 'src/db/schema/base-province'
import { BaseStreetSchema } from 'src/db/schema/base-street'

/**
 * 国家/地区实体
 */
export class BaseCountry implements BaseCountrySchema {
    id: number
    alpha2Code: string
    alpha3Code: string
    numericCode: string
    countryName: string
    countryShortName: string
    countryEnglishName: string
}

/**
 * 省份/直辖市/自治区实体
 */
export class BaseProvince implements BaseProvinceSchema {
    id: number
    provinceId: number
    provinceName: string
    wm: string
}

/**
 * 城市/地区实体
 */
export class BaseCity implements BaseCitySchema {
    id: number
    cityId: number
    cityName: string
    pid: number
}

/**
 * 区县/县级市实体
 */
export class BaseArea implements BaseAreaSchema {
    id: number
    areaId: number
    areaName: string
    pid: number
}

/**
 * 乡镇/街道实体
 */
export class BaseStreet implements BaseStreetSchema {
    id: number
    streetName: string
    father: string
    streetId: string
}
