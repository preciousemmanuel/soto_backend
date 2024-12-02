import mongoose, { Schema, model } from "mongoose";
import {
	DiscountTypes,
	PromoConditions,
	PromoTypes,
	UserTypes,
} from "../../utils/enums/base.enum";

const schema = new mongoose.Schema(
	{
		coupon: {
			type: mongoose.Types.ObjectId,
			ref: "GeneralCoupons",
		},
		activation_date: { type: Date },
		expiry_date: { type: Date },
		total_quantity: { type: Number },
		quantity_left: { type: Number },
		amount_type: {
			type: String,
			enum: [DiscountTypes.FIXED, DiscountTypes.PERCENTAGE],
			default: DiscountTypes.FIXED,
		},
		status: {
			type: String,
			enum: ["active", "inactive"],
			default: "inactive",
		},
		user: {
			type: mongoose.Types.ObjectId,
			ref: "Users",
		},
		order: {
			type: mongoose.Types.ObjectId,
			ref: "Orders",
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	}
);

export default model("UserCoupons", schema);
