import mongoose, { Schema, model } from "mongoose";

const ReviewSchema = new Schema(
  {
    comment: {
      type: String,
    },
    product: {
      type: mongoose.Types.ObjectId,
      ref: "Products",
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
    },
    rating: {
      type: Number,
    },

  },
  {
    collection: "Reviews",
    timestamps: true
  }
);


export default model("Reviews", ReviewSchema);