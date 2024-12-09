import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '..';
// import {} from './types';

export const authApi = createApi({
  baseQuery: baseQuery,
  reducerPath: 'authApi',
  endpoints: (builder) => ({
    refresh: builder.query<any, void>({
      query: () => ({ url: 'auth/refresh', method: 'GET' }),
    }),
  }),
});

export const {} = authApi;
