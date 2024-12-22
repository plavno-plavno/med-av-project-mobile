import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '..';
import { IEmailLoginResponse, ILoginRequest, ISingUpResponse, ISingUpRequest, IResetPasswordResponse, IResetPasswordRequest, IForgotPasswordResponse, IForgotPasswordRequest, IResendEmailRequest, IResendEmailResponse, IEmailConfirm } from './types';

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
    emailSingUp: builder.mutation<void, ISingUpRequest>({
      query: ({email}) => ({
        url: 'auth/email/register',
        method: 'POST',
        body: {
          email,
        },
        headers: {
          'x-ismobile': 'true',
        },
      }),
    }),
    emailConfirm: builder.mutation<void, IEmailConfirm>({
      query: ({hash, password}) => ({
        url: 'auth/email/confirm',
        method: 'POST',
        body: {
          hash,
          password,
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
        headers: {
          'x-ismobile': 'true',
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
        headers: {
          'x-ismobile': 'true',
        },
      }),
    }),
  }),
});

export const {
  useEmailLoginMutation,
  useEmailSingUpMutation,
  useResendEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useEmailConfirmMutation,
} = authApi;
