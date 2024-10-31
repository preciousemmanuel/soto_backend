import Joi from 'joi';

const getdeliveryRateSchema = Joi.object({
  delivery_address: Joi.string().required(),
  parcel_id: Joi.string().required(),
});

const getCitiesSchema = Joi.object({
  country_code: Joi.string().required(),
  state_code: Joi.string().optional(),
});





export default {
  getdeliveryRateSchema,
  getCitiesSchema
}