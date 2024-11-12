import mongoose, { Schema, model } from "mongoose";
import { User } from "@/resources/user/user.interface";
import { IdentificationTypes, TransactionCurrency, TransactionNarration, TransactionStatus, TransactionType, } from "@/utils/enums/base.enum";

const WalletSchema = new Schema(
  {
    current_balance: {
      type: Number,
      default: 0.0
    },

    previous_balance: {
      type: Number,
      default: 0.0
    },

    user: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
    },
  },
  {
    collection: "Walllets",
    timestamps: true
  }
);


export default model("Walllets", WalletSchema);