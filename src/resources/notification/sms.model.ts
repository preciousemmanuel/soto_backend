import {
	NotificationCategory,
	NotificationTypes,
	TransactionStatus,
} from "@/utils/enums/base.enum";
import mongoose, { Schema, model } from "mongoose";

const schema = new Schema(
	{
		receiver: {
			type: String,
		},
		body: {
			type: String,
		},
		status: {
			type: String,
			enum: [
				TransactionStatus.PENDING,
				TransactionStatus.SUCCESSFUL,
				TransactionStatus.FAILED,
			],
			default: TransactionStatus.PENDING,
		},
		response: {
			type: Object,
		},
	},
	{
		collection: "ShortMessages",
		timestamps: true,
	}
);

export default model("ShortMessages", schema);
