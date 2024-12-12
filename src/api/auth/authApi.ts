import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '..';
import { IEmailLoginResponse, ILoginRequest, ISingUpResponse, ISingUpRequest, IResetPasswordResponse, IResetPasswordRequest, IForgotPasswordResponse, IForgotPasswordRequest, IResendEmailRequest, IResendEmailResponse } from './types';

export const authApi = createApi({
  baseQuery: baseQuery,
  reducerPath: 'authApi',
  endpoints: (builder) => ({
    emailLogin: builder.mutation<IEmailLoginResponse, ILoginRequest>({
      query: ({email, password}) => ({
        url: 'auth/email/login',
        method: 'POST',
        body: {
          email,
          password
        },
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
      }),
    }),
    emailSingUp: builder.mutation<ISingUpResponse, ISingUpRequest>({
      query: ({email}) => ({
        url: 'auth/email/register',
        method: 'POST',
        body: {
          email,
        },
      }),
    }),
    resendEmail: builder.mutation<IResendEmailResponse, IResendEmailRequest>({
      query: ({email}) => ({
        url: `auth/sign-up/email-resend/${email}`,
        method: 'POST',
        body: {
          email,
        },
      }),
    }),
    resetPassword: builder.mutation<IResetPasswordResponse, IResetPasswordRequest>({
      query: ({password, hash}) => ({
        url: `auth/reset/password`,
        method: 'POST',
        body: {
          password,
          hash
        },
      }),
    }),
    forgotPassword: builder.mutation<IForgotPasswordResponse, IForgotPasswordRequest>({
      query: ({email}) => ({
        url: `auth/forgot/password`,
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
  useLogoutMutation,
  useEmailSingUpMutation,
  useResendEmailMutation,
  useForgotPasswordMutation,
} = authApi;
