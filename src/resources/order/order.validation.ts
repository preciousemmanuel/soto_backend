import {
  OrderPaymentType,
  OrderStatus,
  YesOrNo,
} from '@/utils/enums/base.enum';
import { email } from 'envalid';
import Joi from 'joi';



const createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      product_id: Joi.string().required(),
      quantity: Joi.number().positive().default(1).required()
    })
  ).min(1).required(),
  shipping_address: Joi.string().optional(),
  payment_type: Joi.string().valid(
    OrderPaymentType.INSTANT,
    OrderPaymentType.ON_DELIVERY,
  ).optional(),
  checkout_with_cart: Joi.string().valid(YesOrNo.YES, YesOrNo.NO).default(YesOrNo.YES).optional()
});

const addToCartSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      product_id: Joi.string().required(),
      quantity: Joi.number().positive().default(1).required()
    })
  ).min(1).required(),
});

const removeFromCartSchema = Joi.object({
  product_id: Joi.string().required(),
});

const modelIdSchema = Joi.object().keys({
  id: Joi.string().required(),
})

const fetchMyOrdersSchema = Joi.object({
  limit: Joi.number().positive().default(10).optional(),
  page: Joi.number().positive().default(1).optional(),
  status: Joi.string().valid(
    OrderStatus.BOOKED,
    OrderStatus.CANCELLED,
    OrderStatus.DELIVERED,
    OrderStatus.FAILED,
    OrderStatus.PENDING,
  ).optional(),
  start_date: Joi.string().optional(),
  end_date: Joi.string().optional(),

});



export default {
  addToCartSchema,
  removeFromCartSchema,
  createOrderSchema,
  fetchMyOrdersSchema,
  modelIdSchema
}