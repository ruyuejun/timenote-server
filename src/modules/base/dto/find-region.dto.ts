import { IsOptional, IsString, IsInt, Min } from 'src/libs/zod2'

/**
 * 获取省份列表（默认中国）
 *
 * @param countryId 国家 ID（可选，默认中国 CN = 1）
 */
export class FindProvinceDto {
    @IsOptional()
    @IsString('国家ID必须是字符串')
    countryId?: string
}

/**
 * 获取城市列表
 *
 * @param provinceId 省份 ID（必填）
 */
export class FindCityDto {
    @IsInt('省份ID必须是整数')
    @Min(1, '省份ID不能小于1')
    provinceId: number
}

/**
 * 获取区县列表
 *
 * @param cityId 城市 ID（必填）
 */
export class FindAreaDto {
    @IsInt('城市ID必须是整数')
    @Min(1, '城市ID不能小于1')
    cityId: number
}

/**
 * 获取街道列表
 *
 * @param areaId 区县 ID（必填）
 */
export class FindStreetDto {
    @IsInt('区县ID必须是整数')
    @Min(1, '区县ID不能小于1')
    areaId: number
}
