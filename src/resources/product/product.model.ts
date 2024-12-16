import { ProductStatus } from "@/utils/enums/base.enum";
import mongoose, { Schema, model } from "mongoose";

const ProductSchema = new Schema(
	{
		product_name: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		product_code: {
			type: String,
			default: "",
		},
		category: {
			type: mongoose.Types.ObjectId,
			ref: "Categories",
		},
		images: {
			type: [String],
		},
		vendor: {
			type: mongoose.Types.ObjectId,
			ref: "Users",
		},
		business: {
			type: mongoose.Types.ObjectId,
			ref: "Businesses",
		},
		rating: {
			type: Number,
		},
		raw_price: {
			type: Number,
			default: 0,
		},
		unit_price: {
			type: Number,
			default: 0,
			required: true,
		},
		product_quantity: {
			type: Number,
			default: 1,
			required: true,
		},
		total_quantity_sold: {
			type: Number,
			default: 0,
		},
		height: {
			type: Number,
			default: 10,
		},
		width: {
			type: Number,
			default: 5,
		},
		weight: {
			type: Number,
			default: 50,
		},
		discount_price: {
			type: Number,
		},
		is_discounted: {
			type: Boolean,
			default: false,
		},
		in_stock: {
			type: Boolean,
			default: false,
		},
		is_verified: {
			type: Boolean,
			default: false,
		},
		is_deleted: {
			type: Boolean,
			default: false,
		},
		status: {
			type: String,
			enum: [
				ProductStatus.PENDING,
				ProductStatus.APPROVED,
				ProductStatus.DECLINED,
			],
			default: ProductStatus.PENDING,
		},
		decline_product_note: {
			type: String,
		},
	},
	{
		collection: "Products",
		timestamps: true,
	}
);

export default model("Products", ProductSchema);
