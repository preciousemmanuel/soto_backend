export enum SignupChannels {
  DEFAULT = "DEFAULT",
  GOOGLE = "GOOGLE",
  FACEBOOK = "FACEBOOK",
  TWITTER = "TWITTER",
}

export enum YesOrNo {
  YES = "YES",
  NO = "NO",
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

export enum IdentificationTypes {
  NIN = "NIN",
  BVN = "BVN",
  DRIVERS_LICENSE = "DRIVERS_LICENSE",
  VOTERS_CARD = "VOTERS_CARD",
  INTERNATIONAL_PASSPORT = "INTERNATIONAL_PASSPORT",
}

export enum CloudUploadOption {
  CLOUDINARY = "CLOUDINARY",
  AWS = 'AWS'
}
