import { ServiceResponse } from 'src/interfaces/service.type'
import { Doc } from '../entities/doc.entity'
import { DocHistory } from '../entities/doc-history.entity'

export type DocVo = ServiceResponse<Doc>

export type DocHistoryVo = ServiceResponse<DocHistory>
