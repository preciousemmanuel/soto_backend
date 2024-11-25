import mongoose, { Schema, model } from "mongoose";
import { User } from "@/resources/user/user.interface";
import { TransactionStatus } from "@/utils/enums/base.enum";

const modelSchema = new Schema(
	{
		amount: {
			type: Number,
			required: true,
		},
		user: {
			type: mongoose.Types.ObjectId,
			ref: "Users",
		},
		account_name: {
			type: String,
			required: true,
		},
		account_number: {
			type: String,
			required: true,
		},
		bank_details: {
			type: mongoose.Types.ObjectId,
			ref: "BankDetails",
			required: true,
		},
		status: {
			type: String,
			enum: TransactionStatus,
			default: TransactionStatus.PENDING,
		},
		reference: {
			type: String,
			required: true,
		},
	},
	{
		collection: "Withdrawals",
		timestamps: true,
	}
);

export default model("Withdrawals", modelSchema);
