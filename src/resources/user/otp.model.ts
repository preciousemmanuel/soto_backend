import mongoose, { Schema, model } from "mongoose";
import { OtpPurposeOptions, SignupChannels, UserTypes } from "@/utils/enums/base.enum";

const OtpSchema = new Schema(
  {

    otp: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    },

    user: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
    },

    email: {
      type: String
    },

    phone_number: {
      type: String
    },
    purpose: {
      type: String,
      enum: OtpPurposeOptions,
      default: OtpPurposeOptions.CHANGE_PASSWORD,
      required: true,
    },

  },
  {
    collection: "OneTimePasswords",
    timestamps: true
  }
);


export default model("OneTimePasswords", OtpSchema);