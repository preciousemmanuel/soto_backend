import mongoose, { Schema, model } from "mongoose";
import { User } from "@/resources/user/user.interface";
import { IdentificationTypes, } from "@/utils/enums/base.enum";




const BusinessSchema = new Schema(
  {

    business_name: {
      type: String,
      required: true
    },

    last_name: {
      type: String,
      required: true
    },

    user: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
    },
    email: {
      type: String,
      required: true
    },
    phone_number: {
      type: String,
      required: true
    },

    verification_type: {
      type: String,
      enum: IdentificationTypes,
    },

    verification_number: {
      type: String,
    },
  },
  {
    collection: "Businesses",
    timestamps: true
  }
);


export default model("Businesses", BusinessSchema);