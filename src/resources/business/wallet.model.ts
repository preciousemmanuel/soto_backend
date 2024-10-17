import mongoose, { Schema, model } from "mongoose";
import { User } from "@/resources/user/user.interface";
import { IdentificationTypes, } from "@/utils/enums/base.enum";




const WalletSchema = new Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
    },
    current_balance: {
      type: Number,
      default: 0.0,
      required: true
    },

    previous_balance: {
      type: Number,
      default: 0.0,
      required: true
    },

    is_open: {
      type: Boolean,
      default: true
    },
  },
  {
    collection: "Wallets",
    timestamps: true
  }
);


export default model("Wallets", WalletSchema);