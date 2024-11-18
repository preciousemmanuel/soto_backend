import mongoose, { Schema, model } from "mongoose";
import { User } from "@/resources/user/user.interface";
import { IdentificationTypes, TransactionCurrency, TransactionNarration, TransactionStatus, TransactionType, } from "@/utils/enums/base.enum";

const schema = new Schema(
  {

    last_4digits: {
      type: String,
      required: true
    },

    token: {
      type: String,
    },

    paystack_token: {
      type: String,
    },

    user: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
    },
    expiry: {
      type: String,
      required: true
    },
    type: {
      type: String,
    },
  },
  {
    collection: "Cards",
    timestamps: true
  }
);


export default model("Cards", schema);