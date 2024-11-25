import mongoose, { Schema, model } from "mongoose";
import { User } from "@/resources/user/user.interface";
import {
	IdentificationTypes,
	PaymentProvider,
	TransactionCurrency,
	TransactionNarration,
	TransactionStatus,
	TransactionType,
} from "@/utils/enums/base.enum";

const TransactionSchema = new Schema(
	{
		reference: {
			type: String,
			unique: true,
			required: true,
		},

		amount: {
			type: Number,
			required: true,
		},

		user: {
			type: mongoose.Types.ObjectId,
			ref: "Users",
			required: true,
		},
		type: {
			type: String,
			enum: TransactionType,
			default: TransactionType.DEBIT,
		},
		status: {
			type: String,
			enum: TransactionStatus,
			default: TransactionStatus.PENDING,
		},
		currency: {
			type: String,
			default: TransactionCurrency.NGN,
		},
		narration: {
			type: String,
			enum: TransactionNarration,
		},
		narration_id: {
			type: String,
		},
		payment_provider: {
			type: String,
			enum: [PaymentProvider.FLUTTERWAVE, PaymentProvider.PAYSTACK],
			default: PaymentProvider.PAYSTACK,
		},

		transfer_request: {
			type: String,
		},
		transfer_response: {
			type: String,
		},
	},
	{
		collection: "TransactionLogs",
		timestamps: true,
	}
);

export default model("TransactionLogs", TransactionSchema);
