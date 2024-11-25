import mongoose, { Schema, model } from "mongoose";
import {
	DiscountTypes,
	PromoConditions,
	PromoTypes,
	UserTypes,
} from "../../utils/enums/base.enum";
import { required } from "joi";

const schema = new mongoose.Schema(
	{
		name: {
			type: String,
		},
		audience: {
			type: String,
			enum: [UserTypes.USER, UserTypes.VENDOR, ""],
			default: UserTypes.USER,
		},
		code: {
			type: String,
			unique: true,
		},
		activation_date: { type: Date },
		expiry_date: { type: Date },
		remove_expiry_date: { type: Boolean },
		total_quantity: { type: Number },
		amount_type: {
			type: String,
			enum: [DiscountTypes.FIXED, DiscountTypes.PERCENTAGE],
			default: DiscountTypes.FIXED,
		},
		coupon_type: {
			type: String,
			enum: [PromoTypes.FREE_SHIPPING, PromoTypes.PRICE_DISCOUNT],
			default: PromoTypes.PRICE_DISCOUNT,
		},
		condition: {
			type: String,
			enum: [
				PromoConditions.NUMBER_OF_GOODS_PURCHASED,
				PromoConditions.TOTAL_PRICE_SPENT_ON_GOODS,
				PromoConditions.NEW_USER,
				"",
			],
			default: "",
		},
		is_condition: {
			type: Boolean,
			default: true,
		},
		amount: {
			type: Number,
			required: true,
		},
		condition_value: {
			type: Number,
		},
		usage_limit: {
			type: Number,
		},
		remove_usage_limit: {
			type: Boolean,
			default: false,
		},
		total_subscribers: {
			type: Number,
			default: 0,
		},
		total_usage: {
			type: Number,
			default: 0,
		},
		active_status: {
			type: Boolean,
			default: true,
		},
		created_by: {
			type: String,
		},
		updated_by: {
			type: String,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		collection: "GeneralCoupons",
	}
);

export default model("GeneralCoupons", schema);
