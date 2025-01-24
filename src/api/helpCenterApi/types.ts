export interface IFaqQuestionsResponse {
  data: FaqEntity[]
  total: number
  page: string
  limit: string
}

export interface FaqEntity {
  id: number
  question: string
  answer: string
  __entity: string
}

export interface IBaseParams {
  page: number
  limit: number
}

export interface IGetHelpTopicsResponse {
  data: HelpTopicEntity[]
  total: number
  page: string
  limit: string
}

export interface HelpTopicEntity {
  id: number
  name: string
  __entity: string
}

export interface IGetFaqQuestionsParams extends IBaseParams {}
export interface IGetHelpTopicsParams extends IBaseParams {}
export interface IGetRequestParams extends IBaseParams {}
