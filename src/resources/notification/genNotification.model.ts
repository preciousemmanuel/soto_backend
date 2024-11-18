import { UserTypes } from "@/utils/enums/base.enum";
import mongoose, { Schema, model } from "mongoose";

const schema = new Schema(
  {
    audience: {
      type: String,
      enum :[
        UserTypes.USER,
        UserTypes.VENDOR,
        UserTypes.ALL,
      ],
      default: UserTypes.ALL,
    },
    type:{
      type: String
    },
    status:{
      type: Boolean,
      default: false
    },
    content:{
      type: String
    },
    title:{
      type: String
    },
    deleted:{
      type: Boolean,
      default: false
    },
    is_read: {
      type: Boolean,
      default: false
    },
    created_by: {
      type: mongoose.Types.ObjectId,
      ref: "Admins",
    },
  },
  {
    collection: "GeneralNotifications",
    timestamps: true
  }
);


export default model("GeneralNotifications", schema);