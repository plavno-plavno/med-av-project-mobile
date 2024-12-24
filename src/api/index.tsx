import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  QueryReturnValue,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query"

import Config from "react-native-config"
import * as Keychain from "react-native-keychain"
import { Mutex } from "async-mutex"
import { navigationRef } from "../navigation/RootNavigation"
import { ScreensEnum } from "src/navigation/ScreensEnum"

const baseURL = Config.BASE_API_URL;

const mutex = new Mutex()

export const baseQuery = fetchBaseQuery({
  baseUrl: baseURL,
  prepareHeaders: async (headers) => {
    const accessToken = await Keychain.getGenericPassword({
      service: "accessToken",
    })
    if (accessToken) {
      headers.set("authorization", `Bearer ${accessToken.password}`)
    }
    return headers
  },
  validateStatus: (response: { status: number }) =>
    response.status === 201 ||
    response.status === 204 ||
    response.status === 200,
})

export const baseQueryWithReAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args: any, api: any, extraOptions: any) => {
  await mutex.waitForUnlock()
  let result
  result = await baseQuery(args, api, extraOptions)
  if (result?.error && result?.error?.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire()
      try {
        const refreshResult: any = await refreshTokenQuery(
          "auth/refresh",
          api,
          extraOptions
        )
        if (refreshResult?.error?.data?.statusCode >= 400) {
          await Keychain.resetGenericPassword({ service: "accessToken" })
          await Keychain.resetGenericPassword({ service: "refreshToken" })
          return refreshResult
        }
        if (refreshResult) {
          await Keychain.setGenericPassword(
            "accessToken",
            refreshResult?.data?.accessToken,
            {service: 'accessToken'},
          );
          await Keychain.setGenericPassword(
            "refreshToken",
            refreshResult.data.refreshToken,
            {
              service: "refreshToken",
            }
          )
          result = await baseQuery(args, api, extraOptions)
        }
      } finally {
        release()
      }
    } else {
      await mutex.waitForUnlock()
      result = await baseQuery(args, api, extraOptions)
    }
  }
  return result as QueryReturnValue<unknown, FetchBaseQueryError, {}>
}

export const refreshTokenQuery = fetchBaseQuery({
  baseUrl: baseURL,
  prepareHeaders: async (headers) => {
    const refreshToken = await Keychain.getGenericPassword({
      service: "refreshToken",
    })
    if (refreshToken) {
      headers.set("authorization", `Bearer ${refreshToken.password}`)
    }
    return headers
  },
})
