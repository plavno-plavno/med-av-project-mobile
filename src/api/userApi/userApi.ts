import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReAuth } from ".."
import { IAuthMeResponse, IUpdateAuthMeRequest, User } from "./types"

export const userApi = createApi({
  baseQuery: baseQueryWithReAuth,
  reducerPath: "userApi",
  endpoints: (builder) => ({
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "auth/logout",
        method: "POST",
        body: {},
      }),
    }),
    authMe: builder.query<IAuthMeResponse, void>({
      query: () => ({ url: "auth/me", method: "GET" }),
    }),
    updateAuthMe: builder.mutation<IAuthMeResponse, IUpdateAuthMeRequest>({
      query: ({
        photo,
        firstName,
        lastName,
        timezone,
        outputLanguage,
        inputLanguage,
        password,
        oldPassword,
      }: IUpdateAuthMeRequest) => ({
        url: "auth/me",
        method: "PATCH",
        body: {
          photo,
          firstName,
          lastName,
          timezone,
          outputLanguage,
          inputLanguage,
          password,
          oldPassword,
        },
      }),
    }),
    changeEmail: builder.mutation<void, { email: string }>({
      query: ({ email }: { email: string }) => ({
        url: "auth/me/email/request",
        method: "PATCH",
        body: {
          email,
        },
      }),
    }),
    deleteAuthMe: builder.mutation<void, void>({
      query: () => ({
        url: "auth/me",
        method: "DELETE",
        body: {},
      }),
    }),
    getUsersById: builder.mutation<{ user: User }, { id: number }>({
      query: ({ id }) => ({ url: `users/${id}`, method: "GET" }),
    }),
  }),
})

export const {
  useChangeEmailMutation,
  useLogoutMutation,
  useAuthMeQuery,
  useUpdateAuthMeMutation,
  useGetUsersByIdMutation,
  useDeleteAuthMeMutation,
} = userApi
