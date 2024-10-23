"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_enum_1 = require("@/utils/enums/base.enum");
const joi_1 = __importDefault(require("joi"));
const updateFcm = joi_1.default.object({
    token: joi_1.default.string().required(),
});
const signupSchema = joi_1.default.object({
    FullName: joi_1.default.string().required(),
    Password: joi_1.default.string().optional(),
    Email: joi_1.default.string().required(),
    PhoneNumber: joi_1.default.string().required(),
    SignupChannel: joi_1.default.string().valid(base_enum_1.SignupChannels.DEFAULT, base_enum_1.SignupChannels.FACEBOOK, base_enum_1.SignupChannels.GOOGLE, base_enum_1.SignupChannels.TWITTER).required(),
    UserType: joi_1.default.string().valid(base_enum_1.UserTypes.USER, base_enum_1.UserTypes.VENDOR).default(base_enum_1.UserTypes.USER).required(),
});
const addShippingAddressSchema = joi_1.default.object({
    address: joi_1.default.string().required(),
});
const userLoginSchema = joi_1.default.object({
    email_or_phone_number: joi_1.default.string().required(),
    password: joi_1.default.string().required(),
    userType: joi_1.default.string().valid(base_enum_1.UserTypes.USER, base_enum_1.UserTypes.VENDOR).required(),
});
const changePasswordRequest = joi_1.default.object({
    email_or_phone_number: joi_1.default.string().required(),
});
const validateOtpSchema = joi_1.default.object({
    otp: joi_1.default.string().required(),
    otp_purpose: joi_1.default.string().valid(base_enum_1.OtpPurposeOptions.ACCOUNT_VALIDATION, base_enum_1.OtpPurposeOptions.CHANGE_PASSWORD, base_enum_1.OtpPurposeOptions.FORGOT_PASSWORD, base_enum_1.OtpPurposeOptions.PASSWORD_RESET, base_enum_1.OtpPurposeOptions.SIGNUP_COMPLETE).required(),
});
const newPasswordSchema = joi_1.default.object({
    new_password: joi_1.default.string().required(),
});
exports.default = {
    updateFcm,
    signupSchema,
    addShippingAddressSchema,
    userLoginSchema,
    changePasswordRequest,
    validateOtpSchema,
    newPasswordSchema
};
