import { OtpPurposeOptions, SignupChannels, Timeline, UserTypes } from '@/utils/enums/base.enum';
import { email } from 'envalid';
import Joi from 'joi';


const updateFcm = Joi.object({
  token: Joi.string().required(),
});

const signupSchema = Joi.object({
  FullName: Joi.string().required(),
  Password: Joi.string().optional(),
  Email: Joi.string().required(),
  PhoneNumber: Joi.string().required(),
  SignupChannel: Joi.string().valid(
    SignupChannels.DEFAULT,
    SignupChannels.FACEBOOK,
    SignupChannels.GOOGLE,
    SignupChannels.TWITTER,
  ).required(),
  UserType: Joi.string().valid(
    UserTypes.USER,
    UserTypes.VENDOR
  ).default(UserTypes.USER).required(),
});

const addShippingAddressSchema = Joi.object({
  address: Joi.string().required(),

});

const userLoginSchema = Joi.object({
  email_or_phone_number: Joi.string().required(),
  password: Joi.string().required(),
  userType: Joi.string().valid(
    UserTypes.USER,
    UserTypes.VENDOR
  ).required(),

});

const changePasswordRequest = Joi.object({
  email_or_phone_number: Joi.string().required(),
});

const validateOtpSchema = Joi.object({
  otp: Joi.string().required(),
  otp_purpose: Joi.string().valid(
    OtpPurposeOptions.ACCOUNT_VALIDATION,
    OtpPurposeOptions.CHANGE_PASSWORD,
    OtpPurposeOptions.FORGOT_PASSWORD,
    OtpPurposeOptions.PASSWORD_RESET,
    OtpPurposeOptions.SIGNUP_COMPLETE,
  ).required(),
});

const newPasswordSchema = Joi.object({
  new_password: Joi.string().required(),
});

const resetPasswordSchema = Joi.object({
  otp: Joi.string().required(),
  new_password: Joi.string().required(),
});

const vendorAnalyticsSchema = Joi.object().keys({
  time_frame: Joi.string().valid(
    Timeline.YESTERDAY,
    Timeline.TODAY,
    Timeline.LAST_7_DAYS,
    Timeline.THIS_MONTH,
    Timeline.LAST_6_MONTHS,
    Timeline.LAST_12_MONTHS,
    Timeline.THIS_YEAR,
    Timeline.LAST_2_YEARS,
  ).allow(null).allow("").default(Timeline.THIS_MONTH).optional(),
  start_date: Joi.string().optional(),
  end_date: Joi.string().optional(),
})

export default {
  updateFcm,
  signupSchema,
  addShippingAddressSchema,
  userLoginSchema,
  changePasswordRequest,
  validateOtpSchema,
  newPasswordSchema,
  vendorAnalyticsSchema,
  resetPasswordSchema
}