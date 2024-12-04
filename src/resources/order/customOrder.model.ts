import mongoose, { Schema, model } from "mongoose";
import {
	OrderPaymentType,
	OrderStatus,
	ProductStatus,
} from "@/utils/enums/base.enum";

const OrderSchema = new Schema(
	{
		product_name: {
			type: String,
			required: true,
		},
		product_brand: {
			type: String,
			default: "soto",
		},
		size: {
			type: String,
			default: null,
		},
		color: {
			type: String,
			default: null,
		},
		type: {
			type: String,
			default: null,
		},
		quantity: {
			type: Number,
			required: true,
		},
		max_price: {
			type: Number,
			default: 0,
		},
		min_price: {
			type: Number,
			default: 0,
		},
		phone_number: {
			type: String,
			default: null,
		},
		email: {
			type: String,
			default: null,
		},
		note: {
			type: String,
			default: null,
		},
		user: {
			type: mongoose.Types.ObjectId,
			ref: "Users",
		},
		tracking_id: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: OrderStatus,
			default: OrderStatus.PENDING,
		},
		approval_status: {
			type: String,
			enum: [
				ProductStatus.PENDING,
				ProductStatus.APPROVED,
				ProductStatus.DECLINED,
			],
			default: ProductStatus.PENDING,
		},
		decline__note: {
			type: String,
			default: null,
		},
	},
	{
		collection: "CustomOrders",
		timestamps: true,
	}
);

export default model("CustomOrders", OrderSchema);
