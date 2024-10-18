import mongoose, { Schema, model } from "mongoose";

const ProductSchema = new Schema(
  {
    product_name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: mongoose.Types.ObjectId,
      ref: "Categories",
    },
    images: {
      type: [String]
    },
    vendor: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
    },
    business: {
      type: mongoose.Types.ObjectId,
      ref: "Businesses",
    },
    rating: {
      type: Number,
    },
    unit_price: {
      type: Number,
      default: 0,
      required: true
    },
    product_quantity: {
      type: Number,
      default: 1,
      required: true
    },
    discount_price: {
      type: Number,
    },
    is_discounted: {
      type: Boolean,
      default: false
    },
    in_stock: {
      type: Boolean,
      default: false
    },
    is_verified: {
      type: Boolean,
      default: false
    },
    is_deleted: {
      type: Boolean,
      default: false
    },

  },
  {
    collection: "Products",
    timestamps: true
  }
);


export default model("Products", ProductSchema);