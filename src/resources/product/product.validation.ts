import {
	YesOrNo,
	UserTypes,
	ProductFetchTypes,
	ProductStatus,
} from "@/utils/enums/base.enum";
import { email } from "envalid";
import Joi from "joi";

const addProductSchema = Joi.object({
	product_name: Joi.string().required(),
	description: Joi.string().required(),
	category: Joi.string().required(),
	images: Joi.array().items(Joi.object({}).optional()).min(2).optional(),
	unit_price: Joi.number().min(0).required(),
	product_quantity: Joi.number().min(0).required(),
	height: Joi.number().min(0).default(10).optional(),
	width: Joi.number().min(0).default(1).optional(),
	weight: Joi.number().min(0).default(50).optional(),
	discount_price: Joi.number().min(0).optional(),
	in_stock: Joi.string().valid(YesOrNo.NO, YesOrNo.YES).required(),
});

const fetchProductSchema = Joi.object({
	limit: Joi.number().positive().default(10).optional(),
	page: Joi.number().positive().default(1).optional(),
	product_name: Joi.string().optional(),
	category: Joi.string().optional(),
	price_upper: Joi.number().min(0).optional(),
	price_lower: Joi.number().min(0).optional(),
	rating: Joi.number().min(0).optional(),
	fetch_type: Joi.string()
		.valid(ProductFetchTypes.POPULAR, ProductFetchTypes.BEST_SELLER)
		.allow(null)
		.allow("")
		.optional(),
	product_status: Joi.string()
		.valid(
			ProductStatus.APPROVED,
			ProductStatus.PENDING,
			ProductStatus.DECLINED
		)
		.optional()
		.allow(null)
		.allow(""),
});

const writeAReviewSchema = Joi.object({
	rating: Joi.number().positive().default(1).optional(),
	comment: Joi.string().required(),
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
	existing_images: Joi.array().items(Joi.string().optional()).min(1).optional(),
});

const addProductReviewSchema = Joi.object({
	product_: Joi.string().required(),
	description: Joi.string().optional(),
	rating: Joi.number().min(1).max(5).required(),
});

export default {
	addProductSchema,
	fetchProductSchema,
	writeAReviewSchema,
	addProductReviewSchema,
	updateProductSchema,
};
