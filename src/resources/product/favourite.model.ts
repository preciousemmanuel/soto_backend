import mongoose, { Schema, model } from "mongoose";

const FavoriteSchema = new Schema(
  {
    product: {
      type: mongoose.Types.ObjectId,
      ref: "Products",
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
    },
  },
  {
    collection: "Favourites",
    timestamps: true
  }
);


export default model("Favourites", FavoriteSchema);