import mongoose, { Schema, model } from "mongoose";
import { User } from "@/resources/user/user.interface";
import { OrderStatus, } from "@/utils/enums/base.enum";

const OrderDetails = new Schema(
  {
    product_id: {
      type: mongoose.Types.ObjectId,
      ref: "Products",
    },
    product_name: {
      type: String,

    },
    quantity: {
      type: Number,
      default: 1,
      required: true
    },
    unit_price: {
      type: Number,
      default: 1,
      required: true
    },
    vendor: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
    },
    buyer: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
    },
    order: {
      type: mongoose.Types.ObjectId,
      ref: "Orders",
    },
    is_discounted: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: OrderStatus,
      default: OrderStatus.PENDING
    },
  },
  {
    collection: "OrderDetails",
    timestamps: true
  }
);


export default model("OrderDetails", OrderDetails);