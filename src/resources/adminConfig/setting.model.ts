import mongoose, { Schema, model } from "mongoose";

import { User } from "@/resources/user/user.interface";
import {
	LogisticsOption,
	OrderStatus,
	SignupChannels,
	UserTypes,
	YesOrNo,
} from "@/utils/enums/base.enum";

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
			coordinates: {
				lat: {
					type: Number,
					default: 6.639438,
				},
				lng: {
					type: Number,
					default: 3.330983,
				},
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
				required: true,
			},
			scheduled: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
				required: true,
			},
			frequency: {
				type: Number,
				default: 1,
				required: true,
			},
		},
		interest_rates: {
			flat: {
				type: Number,
				default: 5,
				required: true,
			},
			special: {
				type: Number,
				default: 1,
				required: true,
			},
		},
		logistics_option: {
			type: String,
			enum: [LogisticsOption.AGILITY, LogisticsOption.TERMINAL_AFRICA],
			default: LogisticsOption.AGILITY,
		},
		agility_token: {
			type: String,
		},
		agility_last_login: {
			type: Date,
		},
		remittance_day: {
			type: Number,
			default: 7,
		},
		order_itinerary: {
			step_1: {
				level: {
					type: Number,
					default: 1,
				},
				description: {
					type: String,
					default: "Order Created",
				},
			},
			step_2: {
				level: {
					type: Number,
					default: 2,
				},
				description: {
					type: String,
					default: "Order Shipped From Vendor To Packaging Warehouse",
				},
			},
			step_3: {
				level: {
					type: Number,
					default: 3,
				},
				description: {
					type: String,
					default: "Order Picked Up for delivery my delivery agent",
				},
			},
			step_4: {
				level: {
					type: Number,
					default: 4,
				},
				description: {
					type: String,
					default: "Order Delivered Successfully",
				},
			},
		},
	},
	{
		collection: "Settings",
		timestamps: true,
	}
);

export default model("Settings", SettingSchema);
