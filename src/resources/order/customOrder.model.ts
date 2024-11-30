import mongoose, { Schema, model } from "mongoose";
import { OrderPaymentType, OrderStatus } from "@/utils/enums/base.enum";

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
		},
		color: {
			type: String,
		},
		type: {
			type: String,
		},
		quantity: {
			type: Number,
			required: true,
		},
		max_price: {
			type: Number,
			required: true,
		},
		min_price: {
			type: Number,
			required: true,
		},
		phone_number: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		note: {
			type: String,
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
	},
	{
		collection: "CustomOrders",
		timestamps: true,
	}
);

export default model("CustomOrders", OrderSchema);
