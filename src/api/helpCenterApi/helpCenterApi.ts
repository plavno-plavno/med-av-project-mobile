import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReAuth } from ".."
import {
  IAddTopicRequest,
  IBaseParams,
  IFaqQuestionsResponse,
  IGetFaqQuestionsParams,
  IGetHelpTopicsParams,
  IGetHelpTopicsResponse,
  IGetRequestParams,
  IGetTopicsResponse,
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
    getMessageCount: builder.query<any, void>({
      query: () => ({
        url: `help/message-count`,
        method: "GET",
      }),
    }),
    getTopics: builder.query<IGetTopicsResponse, IGetHelpTopicsParams>({
      query: ({ limit, page }: IBaseParams) => ({
        url: `help/topic?limit=${limit}&page=${page}`,
        method: "GET",
      }),
    }),
    addTopic: builder.mutation<any, IAddTopicRequest>({
      query: ({ message, category }) => ({
        url: `help/request`,
        method: "POST",
        body: { message, category },
      }),
    }),
  }),
})

export const {
  useAddTopicMutation,
  useGetFaqQuestionsQuery,
  useGetHelpTopicsQuery,
  useGetRequestQuery,
  useGetMessageCountQuery,
  useGetTopicsQuery,
} = helpCenterApi
