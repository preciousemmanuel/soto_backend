import { IdentificationTypes, SignupChannels, Timeline, UserTypes } from '@/utils/enums/base.enum';
import { email } from 'envalid';
import Joi from 'joi';



const modelIdSchema = Joi.object({
  id: Joi.string().required(),

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
  search: Joi.string().allow(null).allow("").optional()
})


export default {
  modelIdSchema,
  DashboardOverviewSchema
}