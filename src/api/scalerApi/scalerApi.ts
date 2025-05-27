import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import Config from "react-native-config"
import { IScalerFindFreeMachinePairSTTResponse, IScalerFindFreeMachineResponse } from "./types"
import { GROUP_NAME } from "src/hooks/constants"

const scalerUrl = Config.SCALER_URL

export const scalerApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: scalerUrl,
    validateStatus: (response: { status: number }) =>
      response.status === 201 ||
      response.status === 204 ||
      response.status === 200,
  }),
  reducerPath: "scalerApi",
  endpoints: (builder) => ({
    scalerFindFreeMachine: builder.mutation<IScalerFindFreeMachineResponse, {id: string}>({
        query: ({id}) => ({
          url: `scaler/find-free-media-machine/${id}`,
          method: "GET",
        }),
      }),
      scalerFindFreeMachinePairSTT: builder.mutation<IScalerFindFreeMachinePairSTTResponse, {id: string}>({
        query: ({id}) => ({
          url: `scaler/find-free-machine-pair-stt/${GROUP_NAME}/${id}`,
          method: "GET",
        }),
      }),
  }),
})

export const { useScalerFindFreeMachineMutation, useScalerFindFreeMachinePairSTTMutation } = scalerApi
