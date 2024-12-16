import {
	OrderPaymentType,
	OrderStatus,
	YesOrNo,
} from "@/utils/enums/base.enum";
import { email } from "envalid";
import Joi from "joi";

const createOrderSchema = Joi.object({
	items: Joi.array()
		.items(
			Joi.object({
				product_id: Joi.string().required(),
				quantity: Joi.number().positive().default(1).required(),
			})
		)
		.min(1)
		.required(),
	shipping_address: Joi.string().optional(),
	payment_type: Joi.string()
		.valid(OrderPaymentType.INSTANT, OrderPaymentType.ON_DELIVERY)
		.optional(),
	checkout_with_cart: Joi.string()
		.valid(YesOrNo.YES, YesOrNo.NO)
		.default(YesOrNo.YES)
		.optional(),
	coupon_code: Joi.string().optional(),
});

const addToCartSchema = Joi.object({
	items: Joi.array()
		.items(
			Joi.object({
				product_id: Joi.string().required(),
				quantity: Joi.number().positive().default(1).required(),
			})
		)
		.min(1)
		.required(),
});

const removeFromCartSchema = Joi.object({
	product_id: Joi.string().required(),
});

const modelIdSchema = Joi.object().keys({
	id: Joi.string().required(),
});

const fetchMyOrdersSchema = Joi.object({
	limit: Joi.number().positive().default(10).optional(),
	page: Joi.number().positive().default(1).optional(),
	status: Joi.string()
		.valid(
			OrderStatus.BOOKED,
			OrderStatus.CANCELLED,
			OrderStatus.DELIVERED,
			OrderStatus.FAILED,
			OrderStatus.PENDING,
			OrderStatus.CUSTOM
		)
		.optional(),
	start_date: Joi.string().optional(),
	end_date: Joi.string().optional(),
});

const CustomOrderSchema = Joi.object({
	orders: Joi.array().items(
		Joi.object({
			product_name: Joi.string().required(),
			product_brand: Joi.string().allow("").optional(),
			size: Joi.string().allow("").optional(),
			color: Joi.string().allow("").optional(),
			type: Joi.string().allow("").optional(),
			quantity: Joi.number().min(1).default(1).optional(),
			max_price: Joi.number().min(1).allow("").optional(),
			min_price: Joi.number().min(1).allow("").optional(),
			phone_number: Joi.string().allow("").optional(),
			email: Joi.string().allow("").optional(),
			note: Joi.string().allow("").optional(),
		})
	),
});

export default {
	addToCartSchema,
	removeFromCartSchema,
	createOrderSchema,
	fetchMyOrdersSchema,
	modelIdSchema,
	CustomOrderSchema,
};
