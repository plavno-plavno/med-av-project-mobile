export interface IEmailRequest {
    email: string;
  }
export interface ILoginRequest {
    email: string;
    password: string;
}
export interface ILoginResponse {
}

export interface ISingUpRequest extends IEmailRequest{};
export interface ISingUpResponse {
}

export interface IResendEmailRequest extends IEmailRequest {};
export interface IResendEmailResponse {
}
export interface IResetPasswordRequest {
    password: string;
    hash: string;
}
export interface IResetPasswordResponse {

}
export interface IForgotPasswordRequest extends IEmailRequest {};
export interface IForgotPasswordResponse {
}
