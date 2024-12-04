import mongoose, { Schema, model } from "mongoose";
import { OrderPaymentType, OrderStatus } from "@/utils/enums/base.enum";

const OrderSchema = new Schema(
	{
		items: [
			{
				product_id: {
					type: mongoose.Types.ObjectId,
					ref: "Products",
					required: true,
				},
				product_name: {
					type: String,
					required: true,
				},
				product_code: {
					type: String,
					default: "",
				},
				description: {
					type: String,
					required: true,
				},
				vendor: {
					type: mongoose.Types.ObjectId,
					ref: "Users",
				},
				images: {
					type: [String],
				},
				quantity: {
					type: Number,
					required: true,
				},
				unit_price: {
					type: Number,
					required: true,
				},
				height: {
					type: Number,
					required: true,
				},
				width: {
					type: Number,
					required: true,
				},
				weight: {
					type: Number,
					required: true,
				},
				is_discounted: {
					type: Boolean,
					default: false,
				},
			},
		],
		user: {
			type: mongoose.Types.ObjectId,
			ref: "Users",
			required: true,
		},
		status: {
			type: String,
			enum: OrderStatus,
			required: true,
		},
		total_amount: {
			type: Number,
			required: true,
		},
		delivery_amount: {
			type: Number,
			default: 0,
		},
		shipping_address: {
			type: String,
		},
		shipping_address_id: {
			type: String,
		},
		expected_delivery_date: {
			type: Date,
		},
		order_itinerary: {
			type: String,
			default: "",
		},
		tracking_id: {
			type: String,
			default: "",
		},
		grand_total: {
			type: Number,
			required: true,
		},
		discounted_amount: {
			type: Number,
			default: 0,
		},
		price_before_discount: {
			type: Number,
			required: true,
		},
		payment_type: {
			type: String,
			enum: OrderPaymentType,
			default: OrderPaymentType.ON_DELIVERY,
		},
		delivery_vendor: {
			type: {},
		},
		is_coupon_applied: {
			type: Boolean,
			default: false,
		},
		general_coupon: {
			type: mongoose.Types.ObjectId,
			ref: "GeneralCoupons",
		},
		applied_coupon: {
			type: mongoose.Types.ObjectId,
			ref: "UserCoupons",
		},
		shipment_charges: {
			type: Boolean,
			default: true,
		},
		shipment: {
			type: mongoose.Types.ObjectId,
			ref: "Shipments",
			// required: true
		},
		agility_price_payload: {},
		agility_captured_shipment: {},
	},
	{
		collection: "Orders",
		timestamps: true,
	}
);

export default model("Orders", OrderSchema);
