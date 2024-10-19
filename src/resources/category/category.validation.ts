import { IdentificationTypes, SignupChannels, UserTypes } from '@/utils/enums/base.enum';
import { email } from 'envalid';
import Joi from 'joi';



const fetchCategoriesSchema = Joi.object({
  search: Joi.string().optional(),
  limit: Joi.number().positive().optional(),
  page: Joi.number().positive().optional(),

});





export default {
  fetchCategoriesSchema
}