import mongoose, { Schema, model } from "mongoose";
import { OrderPaymentType, OrderStatus, } from "@/utils/enums/base.enum";

const CartSchema = new Schema(
  {

    items: [
     {
        product_id: {
          type: mongoose.Types.ObjectId,
          ref: "Products",
          required: true
        },
        product_name: {
          type: String,
          required: true
        },
        description: {
          type: String,
          required: true
        },
        vendor: {
          type: mongoose.Types.ObjectId,
          ref: "Users",
        },
        images: {
          type: [String]
        },
        quantity: {
          type: Number,
          required: true
        },
        unit_price: {
          type: Number,
          required: true
        },
         height:{
          type: Number,
          required: true
        },
        width:{
          type: Number,
          required: true
        },
        weight:{
          type: Number,
          required: true
        },
        is_discounted: {
          type: Boolean,
          default: false
        }
      }
    ],
    user: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
      required: true
    },
    status: {
      type: String,
      enum: OrderStatus,
    },
    total_amount: {
      type: Number,
      required: true
    },
    delivery_amount: {
      type: Number,
      default: 0
    },
    shipping_address: {
      type: String,
    },
    expected_delivery_date: {
      type: Date
    },
    order_itinerary: {
      type: String,
      default: ""
    },
    grand_total: {
      type: Number,
      required: true
    },
    payment_type: {
      type: String,
      enum: OrderPaymentType,
      default: OrderPaymentType.ON_DELIVERY
    }
  },
  {
    collection: "Carts",
    timestamps: true
  }
);


export default model("Carts", CartSchema);