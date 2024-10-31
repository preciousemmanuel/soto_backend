import {
  IdentificationTypes,
  SignupChannels,
  TransactionNarration,
  UserTypes
} from "@/utils/enums/base.enum";
import userModel from "../user/user.model";


export interface GeneratePaymentLinkDto {
  amount: number;
  card_id?: string;
  narration_id: string;
  narration: TransactionNarration;

}

export interface FullPaymentLinkDto extends GeneratePaymentLinkDto {
  user: InstanceType<typeof userModel>;
  txnRef?: string
}

export interface VerificationDto {
  verification_type: IdentificationTypes
  verification_number: string
}

export interface GetTransactionsDto {
  user: InstanceType<typeof userModel>;
  limit: number;
  page: number;
  narration?: TransactionNarration | string;
}

export interface CreateTransactionLogDto {
  user: string;
  amount: number;
  narration: string;
  narration_id: string;
  ref: string;
  type?: string

}


