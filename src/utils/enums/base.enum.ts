export enum SignupChannels {
  DEFAULT = "DEFAULT",
  GOOGLE = "GOOGLE",
  FACEBOOK = "FACEBOOK",
  TWITTER = "TWITTER",
}

export enum UserTypes {
  USER = "USER",
  VENDOR = "VENDOR"
}

export enum StatusMessages {
  success = "success",
  error = "error",
}

export enum OtpPurposeOptions {
  CHANGE_PASSWORD = "CHANGE_PASSWORD",
  FORGOT_PASSWORD = "FORGOT_PASSWORD",
  SIGNUP_COMPLETE = "SIGNUP_COMPLETE",
  PASSWORD_RESET = 'PASSWORD_RESET',
  ACCOUNT_VALIDATION = 'ACCOUNT_VALIDATION'
}
