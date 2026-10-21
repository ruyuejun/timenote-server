import { ResponseBody } from 'src/config/code.config'

export type ServiceResponse<T> = Promise<ResponseBody<T>>
