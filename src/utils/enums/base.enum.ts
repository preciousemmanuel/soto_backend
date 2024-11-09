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
  RETURNED = "RETURNED",
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

export enum TransactionType {
  CREDIT = "CREDIT",
  DEBIT = "DEBIT",
  REVERSAL = "REVERSAL"
}

export enum TransactionStatus {
  PENDING = "PENDING",
  SUCCESSFUL = "SUCCESSFUL",
  FAILED = "FAILED",
  REVERSAL = "REVERSAL",
}

export enum TransactionCurrency {
  NGN = "NGN"
}

export enum TransactionNarration {
  ORDER = "ORDER",
  PAYOUT = "PAYOUT",
  REFUND = "REFUND",
  WITHDRAWAL = "WITHDRAWAL",
}

export enum PaystackWebHookEvents {
  TRANSFER_SUCCESS = "transfer.success",
  TRANSFER_FAILED = "transfer.failed",
  TRANSFER_REVERSED = "transfer.reversed",
  TRANSACTION_SUCCESSFUL = "charge.success"
}

export enum Timeline {
  YESTERDAY = "YESTERDAY",
  TODAY = "TODAY",
  THIS_WEEK = "THIS_WEEK",
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_WEEK = "LAST_WEEK",
  LAST_2_WEEKS = "LAST_2_WEEKS",
  THIS_MONTH = "THIS_MONTH",
  LAST_3_MONTHS = "LAST_3_MONTHS",
  LAST_6_MONTHS = "LAST_6_MONTHS",
  LAST_12_MONTHS = "LAST_12_MONTHS",
  THIS_YEAR = "THIS_YEAR",
  LAST_YEAR = "LAST_YEAR",
  LAST_2_YEARS = "LAST_2_YEARS",
  ALL_TIME = "ALL_TIME",
}

export enum PaymentProvider {
  PAYSTACK = "PAYSTACK",
  FLUTTERWAVE = "FLUTTERWAVE",
}

export enum RequestData {
  params = "params",
  query = "query",
  body = "query"
}

export enum ProductMgtOption {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  PROMO = 'PROMO',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  RETURNED = 'RETURNED',
}