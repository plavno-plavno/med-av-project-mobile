import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '..';
import { IEmailLoginRequest, IEmailLoginResponse, IEmailSingUpRequest, IEmailSingUpResponse } from './types';

export const authApi = createApi({
  baseQuery: baseQuery,
  reducerPath: 'authApi',
  endpoints: (builder) => ({
    emailLogin: builder.mutation<IEmailLoginResponse, IEmailLoginRequest>({
      query: ({email, password}) => ({
        url: 'auth/email/login',
        method: 'POST',
        body: {
          email,
          password
        },
      }),
    }),
    emailSingUp: builder.mutation<IEmailSingUpResponse, IEmailSingUpRequest>({
      query: ({email}) => ({
        url: 'auth/email/register',
        method: 'POST',
        body: {
          email,
        },
      }),
    }),
    refresh: builder.query<any, void>({
      query: () => ({ url: 'auth/refresh', method: 'GET' }),
    }),
  }),
});

export const {
  useEmailLoginMutation,
  useEmailSingUpMutation,
} = authApi;
