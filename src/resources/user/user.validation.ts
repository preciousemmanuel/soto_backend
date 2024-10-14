import { SignupChannels, UserTypes } from '@/utils/enums/base.enum';
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
  userType: Joi.string().valid(UserTypes.USER, UserTypes.VENDOR).required(),

});



export default {
  updateFcm,
  signupSchema,
  addShippingAddressSchema,
  userLoginSchema
}