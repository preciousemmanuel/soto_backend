import mongoose, { Schema, model } from "mongoose";
import { User } from "@/resources/user/user.interface";
import { IdentificationTypes } from "@/utils/enums/base.enum";

const modelSchema = new Schema(
	{
		account_number: {
			type: String,
			unique: true,
			required: true,
		},
		account_name: {
			type: String,
		},
		user: {
			type: mongoose.Types.ObjectId,
			ref: "Users",
		},
		bank: {
			type: mongoose.Types.ObjectId,
			ref: "Banks",
			required: true,
		},
	},
	{
		collection: "BankDetails",
		timestamps: true,
	}
);

export default model("BankDetails", modelSchema);
