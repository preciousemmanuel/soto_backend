import {
	NotificationCategory,
	NotificationTypes,
} from "@/utils/enums/base.enum";
import mongoose, { Schema, model } from "mongoose";

const schema = new Schema(
	{
		sender: {
			type: mongoose.Types.ObjectId,
			ref: "Users",
		},
		receiver: {
			type: mongoose.Types.ObjectId,
			ref: "Users",
		},
		type: {
			type: String,
			default: NotificationTypes.NOTIFICATION,
		},
		status: {
			type: Boolean,
			default: false,
		},
		category: {
			type: String,
			default: NotificationCategory.GENERAL,
		},
		category_id: {
			type: String,
		},
		content: {
			type: String,
		},
		title: {
			type: String,
		},
		deleted: {
			type: Boolean,
			default: false,
		},
		is_read: {
			type: Boolean,
			default: false,
		},
	},
	{
		collection: "Notifications",
		timestamps: true,
	}
);

export default model("Notifications", schema);
