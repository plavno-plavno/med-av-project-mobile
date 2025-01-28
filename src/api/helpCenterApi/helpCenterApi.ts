import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReAuth } from ".."
import {
  IAddMessageRequest,
  IAddTopicRequest,
  IBaseParams,
  IFaqQuestionsResponse,
  IGetHelpTopicsResponse,
  IGetTopicsResponse,
  IRecordingsEntity,
  IRecordingsEntityResponse,
} from "./types"

export const helpCenterApi = createApi({
  baseQuery: baseQueryWithReAuth,
  reducerPath: "helpCenterApi",
  endpoints: (builder) => ({
    getFaqQuestions: builder.query<IFaqQuestionsResponse, IBaseParams>({
      query: ({ limit, page }) => ({
        url: `faq?limit=${limit}&page=${page}`,
        method: "GET",
      }),
    }),
    getHelpTopics: builder.query<IGetHelpTopicsResponse, IBaseParams>({
      query: ({ limit, page }) => ({
        url: `help/topics?limit=${limit}&page=${page}`,
        method: "GET",
      }),
    }),
    getRequest: builder.query<any, IBaseParams>({
      query: ({ limit, page }) => ({
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
    getTopics: builder.query<IGetTopicsResponse, IBaseParams>({
      query: ({ limit, page }) => ({
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
    addMessage: builder.mutation<any, IAddMessageRequest>({
      query: ({ message, file, requestId }) => ({
        url: `help/message/${requestId}`,
        method: "POST",
        body: { message, file },
      }),
    }),
    getHelp: builder.query<any, { id: number }>({
      query: ({ id }) => ({
        url: `help/${id}`,
        method: "GET",
      }),
    }),
    //RECORDINGS
    getRecordings: builder.query<IRecordingsEntityResponse, IBaseParams>({
      query: ({ limit, page }) => ({
        url: `recordings?limit=${limit}&page=${page}`,
        method: "GET",
      }),
    }),
    removeRecordings: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({
        url: `recordings/${id}`,
        method: "DELETE",
      }),
    }),
    downloadRecordings: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({
        url: `recordings/download/${id}`,
        method: "GET",
      }),
    }),
  }),
})

export const {
  useLazyGetHelpQuery,
  useDownloadRecordingsMutation,
  useGetRecordingsQuery,
  useRemoveRecordingsMutation,
  useAddTopicMutation,
  useAddMessageMutation,
  useGetFaqQuestionsQuery,
  useGetHelpTopicsQuery,
  useGetRequestQuery,
  useGetMessageCountQuery,
  useGetTopicsQuery,
} = helpCenterApi
