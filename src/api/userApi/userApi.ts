import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReAuth } from '..';
// import { } from './types';

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
    refresh: builder.query<any, void>({
      query: () => ({ url: 'auth/refresh', method: 'GET' }),
    }),
  }),
});

export const {
  useLogoutMutation,
} = userApi;
