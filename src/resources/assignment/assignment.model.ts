import { OrderStatus } from "@/utils/enums/base.enum";
import mongoose, { Schema, model } from "mongoose";

const schema = new Schema(
	{
		order_details: {
			type: mongoose.Types.ObjectId,
			ref: "OrderDetails",
		},
		extra_detail: {
			type: {},
		},
		purchaser: {
			type: mongoose.Types.ObjectId,
			ref: "Admins",
			required: true,
		},
		status: {
			type: String,
			enum: OrderStatus,
			default: OrderStatus.PENDING,
		},
		vendor_contact: {
			first_name: String,
			last_name: String,
			phone_number: String,
			full_address: String,
			address: String,
			city: String,
			state: String,
			postal_code: String,
			address_id: String,
			coordinates: {
				lat: Number,
				lng: Number,
			},
			country: {
				type: String,
				default: "Nigeria",
			},
		},
	},
	{
		collection: "Assignments",
		timestamps: true,
	}
);

export default model("Assignments", schema);
