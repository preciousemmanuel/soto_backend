import mongoose, { Schema, model } from "mongoose";

const CategorySchema = new Schema(
  {

    name: {
      type: String,
      required: true
    },
    image: {
      type: String,
    },
    icon: {
      type: String,
    },
  },
  {
    collection: "Categories",
    timestamps: true
  }
);


export default model("Categories", CategorySchema);