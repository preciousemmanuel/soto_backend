import { IdentificationTypes, SignupChannels, UserTypes } from '@/utils/enums/base.enum';
import { email } from 'envalid';
import Joi from 'joi';



const createBusinessSchema = Joi.object({
  business_name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone_number: Joi.string().required(),
  last_name: Joi.string().required(),

});

const verifyBusinessSchema = Joi.object({
  verification_type: Joi.string().valid(
    IdentificationTypes.BVN,
    IdentificationTypes.NIN,
    IdentificationTypes.DRIVERS_LICENSE,
    IdentificationTypes.INTERNATIONAL_PASSPORT,
    IdentificationTypes.VOTERS_CARD,
  ).required(),
  verification_number: Joi.string().required(),

});



export default {
  createBusinessSchema,
  verifyBusinessSchema
}