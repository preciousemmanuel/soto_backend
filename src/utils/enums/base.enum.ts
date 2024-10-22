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

export enum OrderStatus {
  PENDING = "PENDING",
  BOOKED = "BOOKED",
  CANCELLED = "CANCELLED",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
}

export enum OrderPaymentType {
  INSTANT = "INSTANT",
  ON_DELIVERY = "ON_DELIVERY",
}

export enum OrderItinerary {
  VENDOR_COONTACTED = "VENDOR_COONTACTED",
  SHIPPED_TO_DROP_OFF_POINT = "SHIPPED_TO_DROP_OFF_POINT",
  AT_DROP_OFF_POINT = "AT_DROP_OFF_POINT",
  PICKED_UP_BY_DEVILVERY_AGENT = "PICKED_UP_BY_DEVILVERY_AGENT",
  DELIVERED_SAFELY = "DELIVERED_SAFELY",
}

export enum MailSendingOptions {
  SENDGRID = 'SENDGRID',
  GMAIL = 'GMAIL',
  MAILGUN = 'MAILGUN',
  MAILTRAP = 'MAILTRAP',
  BREVO = 'BREVO',
}