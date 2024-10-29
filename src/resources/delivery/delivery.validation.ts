import {
  OrderPaymentType,
  OrderStatus,
} from '@/utils/enums/base.enum';
import { email } from 'envalid';
import Joi from 'joi';



const getdeliveryRateSchema = Joi.object({
  delivery_address: Joi.string().required(),
  parcel_id: Joi.string().required(),
});




export default {
  getdeliveryRateSchema
}