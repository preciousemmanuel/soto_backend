import {
	IdentificationTypes,
	ProductMgtOption,
	PromoTypes,
	SignupChannels,
	Timeline,
	UserTypes,
	YesOrNo,
} from "@/utils/enums/base.enum";
import { email } from "envalid";
import Joi from "joi";

const DashboardOverviewSchema = Joi.object().keys({
	timeLine: Joi.string()
		.valid(
			Timeline.YESTERDAY,
			Timeline.TODAY,
			Timeline.LAST_7_DAYS,
			Timeline.THIS_MONTH,
			Timeline.LAST_6_MONTHS,
			Timeline.LAST_12_MONTHS,
			Timeline.THIS_YEAR,
			Timeline.LAST_2_YEARS
		)
		.allow(null)
		.allow("")
		.default(Timeline.THIS_MONTH)
		.optional(),
	limit: Joi.number().positive().optional(),
	page: Joi.number().positive().optional(),
});

const getOrdersSchema = Joi.object().keys({
	timeLine: Joi.string()
		.valid(
			Timeline.YESTERDAY,
			Timeline.TODAY,
			Timeline.LAST_7_DAYS,
			Timeline.THIS_MONTH,
			Timeline.LAST_6_MONTHS,
			Timeline.LAST_12_MONTHS,
			Timeline.THIS_YEAR,
			Timeline.LAST_2_YEARS
		)
		.allow(null)
		.allow("")
		.optional(),
	limit: Joi.number().positive().optional(),
	page: Joi.number().positive().optional(),
	status: Joi.string().optional(),
	tracking_id: Joi.string().optional(),
	product_name: Joi.string().allow(null).allow("").optional(),
	select_type: Joi.string()
		.valid(
			ProductMgtOption.ACTIVE,
			ProductMgtOption.SOLD,
			ProductMgtOption.PROMO,
			ProductMgtOption.OUT_OF_STOCK,
			ProductMgtOption.RETURNED
		)
		.optional(),
});
const modelIdSchema = Joi.object().keys({
	id: Joi.string().required(),
});

const addShippingAddressSchema = Joi.object({
	address: Joi.string().required(),
	city: Joi.string().required(),
	postal_code: Joi.string().optional(),
	state: Joi.string().required(),
	country: Joi.string().default("Nigeria").optional(),
});

const createCouponSchema = Joi.object().keys({
	name: Joi.string().required(),
	coupon_type: Joi.string()
		.valid(
			PromoTypes.FIXED_DISCOUNT,
			PromoTypes.FREE_SHIPPING,
			PromoTypes.PERCENTAGE_DISCOUNT,
			PromoTypes.PRICE_DISCOUNT
		)
		.required(),
	amount: Joi.number().positive().required(),
	applied_to: Joi.string().valid(UserTypes.VENDOR, UserTypes.USER).required(),
	activation_date: Joi.string()
		.pattern(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/)
		.messages({
			"string.pattern.base": "activation_date must be in the format MM/DD/YYYY",
			"string.empty": "activation_date is required",
		})
		.optional(),
	expiry_date: Joi.alternatives().conditional("remove_expiry_date", {
		is: false,
		then: Joi.string()
			.pattern(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/)
			.required()
			.messages({
				"string.pattern.base": "expiry_date must be in the format MM/DD/YYYY",
				"string.empty": "expiry_date is required",
			}),
		otherwise: Joi.string()
			.pattern(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/)
			.optional()
			.messages({
				"string.pattern.base": "expiry_date must be in the format MM/DD/YYYY",
				"string.empty": "expiry_date is required",
			}),
	}),
	remove_expiry_date: Joi.string()
		.valid(YesOrNo.NO, YesOrNo.YES)
		.default(YesOrNo.NO),
	remove_usage_limit: Joi.string()
		.valid(YesOrNo.NO, YesOrNo.YES)
		.default(YesOrNo.NO),
	usage_limit: Joi.alternatives().conditional("remove_usage_limit", {
		is: false,
		then: Joi.number().positive().min(1).required(),
		otherwise: Joi.number().positive().optional(),
	}),
});

const updateCouponSchema = Joi.object()
	.keys({
		name: Joi.string().optional(),
		coupon_type: Joi.string()
			.valid(
				PromoTypes.FIXED_DISCOUNT,
				PromoTypes.FREE_SHIPPING,
				PromoTypes.PERCENTAGE_DISCOUNT,
				PromoTypes.PRICE_DISCOUNT
			)
			.optional(),
		amount: Joi.number().positive().optional(),
		applied_to: Joi.string().valid(UserTypes.VENDOR, UserTypes.USER).optional(),
		activation_date: Joi.string()
			.pattern(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/)
			.messages({
				"string.pattern.base":
					"activation_date must be in the format MM/DD/YYYY",
				"string.empty": "activation_date is required",
			})
			.optional(),
		expiry_date: Joi.alternatives().conditional("remove_expiry_date", {
			is: false,
			then: Joi.string()
				.pattern(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/)
				.messages({
					"string.pattern.base": "expiry_date must be in the format MM/DD/YYYY",
					"string.empty": "expiry_date is required",
				}),
			otherwise: Joi.string()
				.pattern(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/)
				.optional()
				.messages({
					"string.pattern.base": "expiry_date must be in the format MM/DD/YYYY",
					"string.empty": "expiry_date is required",
				}),
		}),
		remove_expiry_date: Joi.string()
			.valid(YesOrNo.NO, YesOrNo.YES)
			.default(YesOrNo.NO),
		remove_usage_limit: Joi.string()
			.valid(YesOrNo.NO, YesOrNo.YES)
			.default(YesOrNo.NO),
		usage_limit: Joi.alternatives().conditional("remove_usage_limit", {
			is: false,
			then: Joi.number().positive().min(1),
			otherwise: Joi.number().positive().optional(),
		}),
	})
	.optional();

const paginateSchema = Joi.object({
	limit: Joi.number().positive().optional(),
	page: Joi.number().positive().optional(),
	start_date: Joi.string()
		.pattern(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/)
		.messages({
			"string.pattern.base": "start_date must be in the format MM/DD/YYYY",
		})
		.optional(),
	end_date: Joi.string()
		.pattern(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/)
		.messages({
			"string.pattern.base": "end_date must be in the format MM/DD/YYYY",
		})
		.optional(),
	search: Joi.string().optional(),
});

const addProductAdminSchema = Joi.object({
	product_name: Joi.string().required(),
	description: Joi.string().required(),
	category: Joi.string().required(),
	images: Joi.array().items(Joi.object({}).optional()).min(2).optional(),
	unit_price: Joi.number().min(0).required(),
	product_quantity: Joi.number().min(0).required(),
	height: Joi.number().min(0).required(),
	width: Joi.number().min(0).required(),
	weight: Joi.number().min(0).required(),
	discount_price: Joi.number().min(0).optional(),
	in_stock: Joi.string().valid(YesOrNo.NO, YesOrNo.YES).required(),
});

const updateProductSchema = Joi.object({
	product_name: Joi.string().optional(),
	description: Joi.string().optional(),
	category: Joi.string().optional(),
	images: Joi.array().items(Joi.object({}).optional()).min(2).optional(),
	unit_price: Joi.number().min(0).optional(),
	product_quantity: Joi.number().min(0).optional(),
	discount_price: Joi.number().min(0).optional(),
	in_stock: Joi.string().valid(YesOrNo.NO, YesOrNo.YES).optional(),
	is_verified: Joi.string().valid(YesOrNo.NO, YesOrNo.YES).optional(),
	existing_images: Joi.array().items(Joi.string().optional()).min(1).optional(),
});

export default {
	addProductAdminSchema,
	DashboardOverviewSchema,
	getOrdersSchema,
	modelIdSchema,
	addShippingAddressSchema,
	createCouponSchema,
	updateCouponSchema,
	paginateSchema,
	updateProductSchema,
};
