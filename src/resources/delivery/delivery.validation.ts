import Joi from 'joi';

const getdeliveryRateSchema = Joi.object({
  delivery_address: Joi.string().required(),
  parcel_id: Joi.string().required(),
});

const getCitiesSchema = Joi.object({
  country_code: Joi.string().required(),
  state_code: Joi.string().optional(),
});


const selectDeliveryOptionSchema = Joi.object({
  parcel: Joi.string().required(),
  rate_id: Joi.string().optional(),
  user: Joi.string().optional(),
  _id: Joi.string().optional(),
  carrier_reference: Joi.string().optional(),
  amount: Joi.number().positive().optional(),
  carrier_name: Joi.string().optional(),
  carrier_rate_description: Joi.string().optional(),
  carrier_slug: Joi.string().optional(),
  delivery_time: Joi.string().optional(),
  delivery_address: Joi.string().optional(),
});




export default {
  getdeliveryRateSchema,
  getCitiesSchema,
  selectDeliveryOptionSchema
}