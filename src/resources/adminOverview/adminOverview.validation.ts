import { IdentificationTypes, ProductMgtOption, SignupChannels, Timeline, UserTypes } from '@/utils/enums/base.enum';
import { email } from 'envalid';
import Joi from 'joi';



const createBusinessSchema = Joi.object({
  business_name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone_number: Joi.string().required(),
  password: Joi.string().required(),
  adress: Joi.string().required(),
  category: Joi.string().required(),
  description: Joi.string().optional(),
  business_logo: Joi.object({}).optional()
});

const DashboardOverviewSchema = Joi.object().keys({
  timeLine: Joi.string().valid(
    Timeline.YESTERDAY,
    Timeline.TODAY,
    Timeline.LAST_7_DAYS,
    Timeline.THIS_MONTH,
    Timeline.LAST_6_MONTHS,
    Timeline.LAST_12_MONTHS,
    Timeline.THIS_YEAR,
    Timeline.LAST_2_YEARS,
  ).allow(null).allow("").default(Timeline.THIS_MONTH).optional(),
  limit: Joi.number().positive().optional(),
  page: Joi.number().positive().optional(),
})

const getOrdersSchema = Joi.object().keys({
  timeLine: Joi.string().valid(
    Timeline.YESTERDAY,
    Timeline.TODAY,
    Timeline.LAST_7_DAYS,
    Timeline.THIS_MONTH,
    Timeline.LAST_6_MONTHS,
    Timeline.LAST_12_MONTHS,
    Timeline.THIS_YEAR,
    Timeline.LAST_2_YEARS,
  ).allow(null).allow("").optional(),
  limit: Joi.number().positive().optional(),
  page: Joi.number().positive().optional(),
  status: Joi.string().optional(),
  tracking_id: Joi.string().optional(),
  product_name: Joi.string().optional(),
  select_type: Joi.string().valid(
    ProductMgtOption.ACTIVE,
    ProductMgtOption.SOLD,
    ProductMgtOption.PROMO,
    ProductMgtOption.OUT_OF_STOCK,
    ProductMgtOption.RETURNED,
  ).optional(),

})
const modelIdSchema = Joi.object().keys({
  id: Joi.string().required(),
})

const addShippingAddressSchema = Joi.object({
  address: Joi.string().required(),
  city: Joi.string().required(),
  postal_code: Joi.string().optional(),
  state: Joi.string().required(),
  country: Joi.string().default("Nigeria").optional(),

});

export default {
  createBusinessSchema,
  DashboardOverviewSchema,
  getOrdersSchema,
  modelIdSchema,
  addShippingAddressSchema
}