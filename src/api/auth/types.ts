export interface IEmailRequest {
  email: string
}
export interface ILoginRequest {
  email: string
  password: string
  deviceId: string | null
}

export interface IEmailLoginResponse {
  refreshToken: string
  token: string
  tokenExpires: number
  user: IUser
}

export interface IUserRole {
  __entity: string
  description: string
  id: number
  name: string
}

export interface IUserStatus {
  __entity: string
  id: number
  name: string
}

export interface IUser {
  __entity: string
  createdAt: string
  dateBirth: string
  deletedAt: string
  department: string
  directoryId: string
  email: string
  firstName: string
  gmtDelta: number
  id: number
  isTwoFAEnabled: boolean
  language: string
  lastName: string
  newEmail: boolean
  organization: string
  photo: string
  provider: string
  role: IUserRole
  socialId: number
  status: IUserStatus
  subscribePlan: string
  title: string
  updatedAt: string
}

export interface IEmailLoginResponse {
  refreshToken: string
  token: string
  tokenExpires: number
  user: IUser
}

export interface ISingUpRequest extends IEmailRequest {}
export interface ISingUpResponse {}

export interface IResendEmailRequest extends IEmailRequest {}
export interface IResendEmailResponse {}
export interface IResetPasswordRequest {
  password: string
  hash: string
}
export interface IResetPasswordResponse {}
export interface IForgotPasswordRequest extends IEmailRequest {}
export interface IForgotPasswordResponse {}

export interface IEmailConfirm {
  hash: string
  password: string
}

export interface ILanguageOptions {
  code: string
  id: number
  name: string
}
