import mongoose, { Schema, model } from "mongoose";

import { User } from "@/resources/user/user.interface";
import { SignupChannels, UserTypes, YesOrNo } from "@/utils/enums/base.enum";

const SettingSchema = new Schema(
	{
		ShippingAddress: {
			full_address: String,
			address: String,
			city: String,
			state: String,
			postal_code: String,
			address_id: String,
			country: {
				type: String,
				default: "Nigeria",
			},
		},
		shipping_address_id: {
			type: String,
		},
		withdrawals: {
			manual: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
			scheduled: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
			frequency: {
				type: Number,
				default: 1,
			},
		},
	},
	{
		collection: "Settings",
		timestamps: true,
	}
);

export default model("Settings", SettingSchema);
