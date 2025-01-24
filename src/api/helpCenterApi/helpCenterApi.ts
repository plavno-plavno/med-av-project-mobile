import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReAuth } from ".."
import { IFaqQuestionsResponse, IGetFaqQuestionsParams } from "./types"

export const helpCenterApi = createApi({
  baseQuery: baseQueryWithReAuth,
  reducerPath: "helpCenterApi",
  endpoints: (builder) => ({
    getFaqQuestions: builder.query<
      IFaqQuestionsResponse,
      IGetFaqQuestionsParams
    >({
      query: ({ limit, page }: IGetFaqQuestionsParams) => ({
        url: `faq?limit=${limit}&page=${page}`,
        method: "GET",
      }),
    }),
  }),
})

export const { useGetFaqQuestionsQuery } = helpCenterApi
