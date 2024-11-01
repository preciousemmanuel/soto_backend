import mongoose, { Schema, model } from "mongoose";
import { User } from "@/resources/user/user.interface";
import { IdentificationTypes, TransactionCurrency, TransactionNarration, TransactionStatus, TransactionType, } from "@/utils/enums/base.enum";

const TransactionSchema = new Schema(
  {

    reference: {
      type: String,
      unique: true,
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    user: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
    },
    type: {
      type: String,
      enum: TransactionType,
      default: TransactionType.DEBIT
    },
    status: {
      type: String,
      enum: TransactionStatus,
      default: TransactionStatus.PENDING
    },
    currency: {
      type: String,
      default: TransactionCurrency.NGN
    },
    narration: {
      type: String,
      enum: TransactionNarration
    },
    narration_id: {
      type: String,
    },

    transfer_request: {
      type: String,
    },
    transfer_response: {
      type: String,
    },
  },
  {
    collection: "TransactionLogs",
    timestamps: true
  }
);


export default model("TransactionLogs", TransactionSchema);