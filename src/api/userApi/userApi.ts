import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReAuth } from '..';
import { IAuthMeResponse, IUpdateAuthMeRequest } from './types';

export const userApi = createApi({
  baseQuery: baseQueryWithReAuth,
  reducerPath: 'userApi',
  endpoints: (builder) => ({
    logout: builder.mutation<void, void>({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
        body: {},
      }),
    }),
    authMe: builder.query<IAuthMeResponse, void>({
      query: () => ({ url: 'auth/me', method: 'GET' }),
    }),
    updateAuthMe: builder.mutation<IAuthMeResponse, IUpdateAuthMeRequest>({
      query: ({photo, firstName, lastName, gmtDelta}: IUpdateAuthMeRequest) => ({ url: 'auth/me', method: 'PATCH', body : {
        photo,
        firstName,
        lastName,
        gmtDelta
      } }),
    }),
  }),
});

export const {
  useLogoutMutation,
  useAuthMeQuery,
  useUpdateAuthMeMutation,
} = userApi;
