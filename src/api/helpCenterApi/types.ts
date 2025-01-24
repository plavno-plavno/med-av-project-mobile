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

export interface IGetFaqQuestionsParams {
  limit: number
  page: number
}
