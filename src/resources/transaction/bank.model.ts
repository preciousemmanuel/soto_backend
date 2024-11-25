import mongoose, { Schema, model } from "mongoose";
import { User } from "@/resources/user/user.interface";
import { TransactionCurrency } from "@/utils/enums/base.enum";

const modelSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		slug: {
			type: String,
		},
		code: {
			type: String,
			required: true,
		},
		longcode: {
			type: String,
		},
		country: {
			type: String,
		},
		currency: {
			type: String,
			default: TransactionCurrency.NGN,
		},
		type: {
			type: String,
		},
	},
	{
		collection: "Banks",
		timestamps: true,
	}
);

export default model("Banks", modelSchema);
