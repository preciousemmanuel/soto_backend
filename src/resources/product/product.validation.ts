import { YesOrNo, UserTypes } from '@/utils/enums/base.enum';
import { email } from 'envalid';
import Joi from 'joi';




const addProductSchema = Joi.object({
  product_name: Joi.string().required(),
  description: Joi.string().required(),
  category: Joi.string().required(),
  images: Joi.array().items(
    Joi.object({}).optional()
  ).min(2).optional(),
  unit_price: Joi.number().min(0).required(),
  product_quantity: Joi.number().min(0).required(),
  height: Joi.number().min(0).required(),
  width: Joi.number().min(0).required(),
  weight: Joi.number().min(0).required(),
  discount_price: Joi.number().min(0).optional(),
  in_stock: Joi.string().valid(
    YesOrNo.NO,
    YesOrNo.YES,
  ).required(),

});

const fetchProductSchema = Joi.object({
  limit: Joi.number().positive().default(10).optional(),
  page: Joi.number().positive().default(1).optional(),
  product_name: Joi.string().optional(),
  category: Joi.string().optional(),
  price_upper: Joi.number().min(0).optional(),
  price_lower: Joi.number().min(0).optional(),

});

const writeAReviewSchema = Joi.object({
  rating: Joi.number().positive().default(1).optional(),
  comment: Joi.string().required(),
});

const updateProductSchema = Joi.object({
  product_name: Joi.string().optional(),
  description: Joi.string().optional(),
  category: Joi.string().optional(),
  images: Joi.array().items(
    Joi.object({}).optional()
  ).min(2).optional(),
  unit_price: Joi.number().min(0).optional(),
  product_quantity: Joi.number().min(0).optional(),
  discount_price: Joi.number().min(0).optional(),
  in_stock: Joi.string().valid(
    YesOrNo.NO,
    YesOrNo.YES,
  ).optional(),
  existing_images: Joi.array().items(
    Joi.string().optional()
  ).min(1).optional(),
});




export default {
  addProductSchema,
  fetchProductSchema,
  writeAReviewSchema,
  updateProductSchema
}