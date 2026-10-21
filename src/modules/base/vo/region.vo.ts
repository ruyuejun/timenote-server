import { ServiceResponse } from 'src/interfaces/service.type'
import { BaseArea, BaseCity, BaseCountry, BaseProvince, BaseStreet } from '../entities/region.entity'

export type CountryVo = ServiceResponse<BaseCountry>
export type ProvinceVo = ServiceResponse<BaseProvince>
export type CityVo = ServiceResponse<BaseCity>
export type AreaVo = ServiceResponse<BaseArea>
export type StreetVo = ServiceResponse<BaseStreet>
