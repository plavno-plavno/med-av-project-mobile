import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReAuth } from ".."
import {
  IBaseParams,
  IFaqQuestionsResponse,
  IGetFaqQuestionsParams,
  IGetHelpTopicsParams,
  IGetHelpTopicsResponse,
  IGetRequestParams,
} from "./types"

export const helpCenterApi = createApi({
  baseQuery: baseQueryWithReAuth,
  reducerPath: "helpCenterApi",
  endpoints: (builder) => ({
    getFaqQuestions: builder.query<
      IFaqQuestionsResponse,
      IGetFaqQuestionsParams
    >({
      query: ({ limit, page }: IBaseParams) => ({
        url: `faq?limit=${limit}&page=${page}`,
        method: "GET",
      }),
    }),
    getHelpTopics: builder.query<IGetHelpTopicsResponse, IGetHelpTopicsParams>({
      query: ({ limit, page }: IBaseParams) => ({
        url: `help/topics?limit=${limit}&page=${page}`,
        method: "GET",
      }),
    }),
    getRequest: builder.query<any, IGetRequestParams>({
      query: ({ limit, page }: IBaseParams) => ({
        url: `help?limit=${limit}&page=${page}`,
        method: "GET",
      }),
    }),
    // getRequestUnreadCount: builder.query<any, any>({
    //   query: ({ id }: any) => ({
    //     url: `help?id=${id}`,
    //     method: "GET",
    //   }),
    // }),
  }),
})

export const {
  useGetFaqQuestionsQuery,
  useGetHelpTopicsQuery,
  useGetRequestQuery,
} = helpCenterApi
