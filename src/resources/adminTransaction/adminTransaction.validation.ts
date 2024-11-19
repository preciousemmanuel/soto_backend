import { IdentificationTypes, SignupChannels, Timeline, UserTypes } from '@/utils/enums/base.enum';
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


export default {
  createBusinessSchema,
  DashboardOverviewSchema
}