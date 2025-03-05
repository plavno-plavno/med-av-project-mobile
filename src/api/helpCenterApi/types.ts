// Shared Interfaces for Pagination and Base Params
export interface IBaseParams {
  page: number
  limit: number
}

export interface IPaginatedResponse<T> {
  data: T[]
  total: number
  page: string
  limit: string
}

export interface IRecordingsEntityResponse
  extends IPaginatedResponse<IRecordingsEntity> {}

export interface IRecordingsEntity {
  id: number
  title: string
  duration: string
  time: string
  createdAt?: string
}

export interface FaqEntity {
  id: number
  question: string
  answer: string
  __entity: string
}

export interface IFaqQuestionsResponse extends IPaginatedResponse<FaqEntity> {}

export interface HelpTopicEntity {
  id: number
  name: string
  __entity: string
}

export interface IGetHelpTopicsResponse
  extends IPaginatedResponse<HelpTopicEntity> {}

export interface IGetTopicsResponse
  extends IPaginatedResponse<HelpTopicEntity> {}

export interface IAddTopicRequest {
  message: string
  category: {
    id: number
  }
}

export interface IAddMessageRequest {
  message?: string
  requestId: number
  file?: {
    id: string | null
  }
}
