import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReAuth } from '..';
import { IAuthMeResponse } from './types';

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
  }),
});

export const {
  useLogoutMutation,
  useAuthMeQuery,
} = userApi;
